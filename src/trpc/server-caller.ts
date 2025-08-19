import "server-only";
import { headers } from "next/headers";
import { cache } from "react";

export const getServerCaller = cache(async () => {
  const [{ appRouter }, { createTRPCContext }] = await Promise.all([
    import("~/server/api/root"),
    import("~/server/api/trpc"),
  ]);

  const ctx = await createTRPCContext({
    headers: await headers(),
    resHeaders: new Headers(),
  });
  return appRouter.createCaller(ctx);
});
