import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { protectedProcedure } from "~/server/api/protectedCompat";
import { checkoutPreviewInput, checkoutCompleteInput } from "~/server/api/schema/checkout";
import { checkoutStub } from "~/server/services/checkoutStub";
import { features } from "~/config/features";
import { getDb } from "~/server/firebase/admin-lazy";

export const checkoutRouter = createTRPCRouter({
  preview: protectedProcedure
    .input(checkoutPreviewInput)
    .query(({ input }) => {
      if (!features.stubCheckout) throw new Error("Checkout disabled");
      return checkoutStub.preview(input);
    }),

  complete: protectedProcedure
    .input(checkoutCompleteInput)
    .mutation(async ({ input }) => {
      if (!features.stubCheckout) {
        throw new Error("Stub checkout disabled");
      }
      const db = await getDb();
      // ✅ take the UID from input (stub-only)
      return checkoutStub.complete(db, input.uid, input);
    }),
});
