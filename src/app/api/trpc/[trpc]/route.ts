export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
function baseHeaders() {
  const h = new Headers();
  h.set("x-trpc-handler", "router");
  h.set("cache-control", "no-store");
  return h;
}
function jsonHeaders() {
  const h = baseHeaders();
  h.set("content-type", "application/json; charset=utf-8");
  return h;
}

async function lightResponses(req: Request) {
  if (req.method === "HEAD")
    return new Response(null, { status: 204, headers: baseHeaders() });
  const url = new URL(req.url);
  if (url.searchParams.has("__probe")) {
    return new Response(
      JSON.stringify({
        ok: true,
        kind: "router",
        ts: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: jsonHeaders(),
      },
    );
  }
  return null;
}

async function handler(req: Request) {
  const light = await lightResponses(req);
  if (light) return light;

  let appRouter: any;
  let createTRPCContext: any;
  try {
    ({ appRouter } = await import("~/server/api/root"));
    ({ createTRPCContext } = await import("~/server/api/trpc"));
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        stage: "import",
        message: err?.message ?? "import error",
      }),
      {
        status: 200,
        headers: jsonHeaders(),
      },
    );
  }

  try {
    const { fetchRequestHandler } = await import("@trpc/server/adapters/fetch");
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => await createTRPCContext({ req }),
      onError({ error, path }) {
        console.error("[tRPC] error", {
          path,
          message: error.message,
          code: (error as any)?.code,
        });
      },
      responseMeta({ errors }) {
        const headers = baseHeaders();
        return { headers, status: errors?.length ? 200 : undefined };
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        stage: "adapter",
        message: err?.message ?? "adapter error",
      }),
      {
        status: 200,
        headers: jsonHeaders(),
      },
    );
  }
}

export { handler as GET, handler as POST, handler as OPTIONS, handler as HEAD };
