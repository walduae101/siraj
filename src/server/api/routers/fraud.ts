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
        } else {
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
          } else {
            return await listsService.listAllowlist(input.type);
          }
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
        .mutation(async ({ ctx, input }) => {
          const adminUid = ctx.adminUser?.uid;
          if (!adminUid) throw new TRPCError({ code: "UNAUTHORIZED" });

          const db = await getDb();
          const reviewRef = db.collection("manualReviews").doc(input.id);

          const review = await reviewRef.get();
          if (!review.exists) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Review not found",
            });
          }

          const reviewData = review.data()!;
          if (reviewData.status !== "open") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Review already resolved",
            });
          }

          const status = input.action === "approve" ? "approved" : "denied";

          await reviewRef.update({
            status,
            resolvedBy: adminUid,
            resolvedAt: new Date(),
            adminNotes: input.notes,
            updatedAt: new Date(),
          });

          // If approved, create reversal if needed
          if (input.action === "approve" && reviewData.requiresReversal) {
            await createReversal(reviewData);
          }

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
          } else {
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
          }
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
