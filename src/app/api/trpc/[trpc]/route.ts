import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid any caching on this route

function trpcHandler(req: Request) {
  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      // NOTE: createTRPCContext is async; adapter supports async
      createContext: createTRPCContext,
      onError({ path, error, type, req }) {
        const msg = `[tRPC] path=${path ?? "(root)"} type=${type} code=${error.code} msg=${error.message}`;
        console.error(msg);
      },
    });
  } catch (e: any) {
    console.error("[tRPC] top-level handler error", e?.stack || e?.message || e);
    return new Response(JSON.stringify({ error: "trpc-handler-failed" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

export { trpcHandler as GET, trpcHandler as POST };

// Optional: explicit HEAD to avoid unexpected adapter behavior on HEAD
export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
