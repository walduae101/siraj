import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getConfig } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";
import { type ListType, listsService } from "~/server/services/lists";
import { riskEngine } from "~/server/services/riskEngine";

export const fraudRouter = createTRPCRouter({
  // Risk evaluation (server-only, called by checkout flow)
  risk: createTRPCRouter({
    evaluateCheckout: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          quantity: z.number().int().min(1).max(10),
          price: z.number().positive(),
          recaptchaToken: z.string().optional(),
          appCheckToken: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const uid = ctx.user?.uid ?? ctx.userId;
        if (!uid) throw new TRPCError({ code: "UNAUTHORIZED" });

        const config = await getConfig();
        const db = await getDb();

        // Get user data
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const userData = userDoc.data()!;
        const email = userData.email || "";

        // Calculate account age
        const createdAt = userData.createdAt?.toDate() || new Date();
        const accountAgeMinutes = Math.floor(
          (Date.now() - createdAt.getTime()) / (1000 * 60),
        );

        // Get client IP (from headers or context)
        const ip =
          (ctx.headers?.get("x-forwarded-for") as string) ||
          (ctx.headers?.get("x-real-ip") as string) ||
          "127.0.0.1";

        // Get user agent
        const userAgent = (ctx.headers?.get("user-agent") as string) || "";

        // Evaluate risk
        const decision = await riskEngine.evaluateCheckout({
          uid,
          email,
          ip,
          userAgent,
          accountAgeMinutes,
          orderIntent: {
            productId: input.productId,
            quantity: input.quantity,
            price: input.price,
          },
          recaptchaToken: input.recaptchaToken,
          appCheckToken: input.appCheckToken,
        });

        // Handle decision based on shadow mode
        if (config.features.FRAUD_SHADOW_MODE) {
          // Shadow mode: always proceed but log decision
          return {
            decision,
            proceed: true,
            shadow: true,
            message: `Shadow mode: ${decision.action} (score: ${decision.score})`,
          };
        }
        // Enforce mode: block based on decision
        switch (decision.action) {
          case "allow":
            return {
              decision,
              proceed: true,
              shadow: false,
              message: "Checkout allowed",
            };

          case "challenge":
            return {
              decision,
              proceed: false,
              shadow: false,
              message: "reCAPTCHA challenge required",
              requiresRecaptcha: true,
            };

          case "deny":
            return {
              decision,
              proceed: false,
              shadow: false,
              message: "Checkout denied due to risk",
            };

          case "queue_review":
            // Create manual review entry
            await createManualReview(decision, uid, input);
            return {
              decision,
              proceed: false,
              shadow: false,
              message: "Checkout queued for manual review",
            };

          default:
            return {
              decision,
              proceed: false,
              shadow: false,
              message: "Unknown decision action",
            };
        }
      }),
  }),

  // Admin list management
  admin: createTRPCRouter({
    lists: createTRPCRouter({
      // List all entries
      list: adminProcedure
        .input(
          z.object({
            type: z
              .enum(["ip", "uid", "emailDomain", "device", "bin"])
              .optional(),
            list: z.enum(["denylist", "allowlist"]),
          }),
        )
        .query(async ({ input }) => {
          if (input.list === "denylist") {
            return await listsService.listDenylist(input.type);
          }
          return await listsService.listAllowlist(input.type);
        }),

      // Add to denylist
      addToDenylist: adminProcedure
        .input(
          z.object({
            type: z.enum(["ip", "uid", "emailDomain", "device", "bin"]),
            value: z.string(),
            reason: z.string(),
            notes: z.string().optional(),
            expiresAt: z.date().optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const adminUid = ctx.adminUser?.uid;
          if (!adminUid) throw new TRPCError({ code: "UNAUTHORIZED" });

          await listsService.addToDenylist({
            type: input.type,
            value: input.value,
            reason: input.reason,
            notes: input.notes,
            expiresAt: input.expiresAt,
            addedBy: adminUid,
          });

          return { success: true };
        }),

      // Add to allowlist
      addToAllowlist: adminProcedure
        .input(
          z.object({
            type: z.enum(["ip", "uid", "emailDomain", "device", "bin"]),
            value: z.string(),
            reason: z.string(),
            notes: z.string().optional(),
            expiresAt: z.date().optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const adminUid = ctx.adminUser?.uid;
          if (!adminUid) throw new TRPCError({ code: "UNAUTHORIZED" });

          await listsService.addToAllowlist({
            type: input.type,
            value: input.value,
            reason: input.reason,
            notes: input.notes,
            expiresAt: input.expiresAt,
            addedBy: adminUid,
          });

          return { success: true };
        }),

      // Remove from denylist
      removeFromDenylist: adminProcedure
        .input(
          z.object({
            type: z.enum(["ip", "uid", "emailDomain", "device", "bin"]),
            value: z.string(),
          }),
        )
        .mutation(async ({ input }) => {
          await listsService.removeFromDenylist(input.type, input.value);
          return { success: true };
        }),

      // Remove from allowlist
      removeFromAllowlist: adminProcedure
        .input(
          z.object({
            type: z.enum(["ip", "uid", "emailDomain", "device", "bin"]),
            value: z.string(),
          }),
        )
        .mutation(async ({ input }) => {
          await listsService.removeFromAllowlist(input.type, input.value);
          return { success: true };
        }),

      // Clean up expired entries
      cleanupExpired: adminProcedure.mutation(async () => {
        return await listsService.cleanupExpired();
      }),
    }),

    // Manual review management
    reviews: createTRPCRouter({
      // List manual reviews
      list: adminProcedure
        .input(
          z.object({
            status: z.enum(["open", "approved", "denied"]).optional(),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          }),
        )
        .query(async ({ input }) => {
          const db = await getDb();
          let query = db
            .collection("manualReviews")
            .orderBy("createdAt", "desc");

          if (input.status) {
            query = query.where("status", "==", input.status);
          }

          const snapshot = await query
            .limit(input.limit)
            .offset(input.offset)
            .get();

          return snapshot.docs
            .map((doc: any) => {
              const data = doc.data();
              if (!data) return null;
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
              };
            })
            .filter(Boolean);
        }),

      // Get review statistics by age buckets
      stats: adminProcedure.input(z.object({})).query(async () => {
        const db = await getDb();
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = {
          pending: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
          inReview: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
          escalated: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
        };

        // Get all manual reviews
        const reviews = await db.collection("manualReviews").get();

        for (const doc of reviews.docs) {
          const data = doc.data();
          const createdAt = data.createdAt.toDate();
          const ageInDays =
            (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);

          let ageBucket: "0-1" | "2-3" | "4-7" | ">7";
          if (ageInDays <= 1) ageBucket = "0-1";
          else if (ageInDays <= 3) ageBucket = "2-3";
          else if (ageInDays <= 7) ageBucket = "4-7";
          else ageBucket = ">7";

          const status = data.status as keyof typeof stats;
          if (status in stats) {
            stats[status][ageBucket]++;
          }
        }

        return stats;
      }),

      // Get single review
      get: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          const db = await getDb();
          const doc = await db.collection("manualReviews").doc(input.id).get();

          if (!doc.exists) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Review not found",
            });
          }

          const data = doc.data()!;
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        }),

      // Resolve review
      resolve: adminProcedure
        .input(
          z.object({
            id: z.string(),
            action: z.enum(["approve", "deny"]),
            notes: z.string(),
          }),
        )
        .mutation(async ({ input }) => {
          const db = await getDb();
          const reviewRef = db.collection("manualReviews").doc(input.id);

          await reviewRef.update({
            status: input.action === "approve" ? "approved" : "denied",
            resolvedAt: new Date(),
            adminNotes: input.notes,
          });

          return { success: true };
        }),
    }),

    // Risk decision statistics
    stats: createTRPCRouter({
      decisions: adminProcedure
        .input(z.object({ days: z.number().int().min(1).max(30).default(1) }))
        .query(async ({ input }) => {
          return await riskEngine.getDecisionStats(input.days);
        }),

      recentDecisions: adminProcedure
        .input(
          z.object({
            uid: z.string().optional(),
            limit: z.number().int().min(1).max(100).default(20),
          }),
        )
        .query(async ({ input }) => {
          if (input.uid) {
            return await riskEngine.getRecentDecisions(input.uid, input.limit);
          }
          const db = await getDb();
          const snapshot = await db
            .collection("riskDecisions")
            .orderBy("createdAt", "desc")
            .limit(input.limit)
            .get();

          return snapshot.docs
            .map((doc: any) => {
              const data = doc.data();
              if (!data) return null;
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                expiresAt: data.expiresAt?.toDate(),
              };
            })
            .filter(Boolean);
        }),

      // App Check failure rate statistics
      appCheck: adminProcedure.input(z.object({})).query(async () => {
        const db = await getDb();
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get App Check logs from the last 30 days
        const logsSnapshot = await db
          .collection("fraudLogs")
          .where("timestamp", ">=", thirtyDaysAgo.toISOString())
          .get();

        const logs = logsSnapshot.docs.map((doc) => doc.data());

        // Calculate overall stats
        const totalRequests = logs.length;
        const failedRequests = logs.filter((log) =>
          log.reasons?.some((r: string) => r.includes("app_check_failed")),
        ).length;
        const failureRate =
          totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

        // Calculate last 24h stats
        const last24hLogs = logs.filter(
          (log) => new Date(log.timestamp) >= oneDayAgo,
        );
        const last24hTotal = last24hLogs.length;
        const last24hFailed = last24hLogs.filter((log) =>
          log.reasons?.some((r: string) => r.includes("app_check_failed")),
        ).length;
        const last24hRate =
          last24hTotal > 0 ? (last24hFailed / last24hTotal) * 100 : 0;

        return {
          totalRequests,
          failedRequests,
          failureRate,
          last24h: {
            total: last24hTotal,
            failed: last24hFailed,
            rate: last24hRate,
          },
        };
      }),
    }),
  }),
});

// Helper function to create manual review
async function createManualReview(
  decision: any,
  uid: string,
  checkoutInput: any,
) {
  const db = await getDb();
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db
    .collection("manualReviews")
    .doc(reviewId)
    .set({
      decisionId: decision.id,
      uid,
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date(),
      decision: {
        action: decision.action,
        score: decision.score,
        reasons: decision.reasons,
      },
      checkout: {
        productId: checkoutInput.productId,
        quantity: checkoutInput.quantity,
        price: checkoutInput.price,
      },
      requiresReversal: false, // Set based on business logic
    });
}

// Helper function to create reversal
async function createReversal(reviewData: any) {
  // Implementation depends on your ledger system
  // This would create a reversal transaction in the user's wallet
  console.log("Creating reversal for review:", reviewData.id);
}
