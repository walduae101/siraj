import { publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  const userId =
    (ctx as any)?.auth?.userId ??
    (ctx as any)?.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next();
});
