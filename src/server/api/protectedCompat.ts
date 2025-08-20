import { TRPCError } from "@trpc/server";
import { publicProcedure } from "~/server/api/trpc";

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  const firebaseUser = ctx.firebaseUser;
  if (!firebaseUser || !firebaseUser.uid) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Firebase authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: firebaseUser,
      userId: firebaseUser.uid,
    },
  });
});
