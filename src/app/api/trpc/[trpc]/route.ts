export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function baseHeaders() {
  const h = new Headers();
  h.set('x-trpc-handler', 'router');
  h.set('cache-control', 'no-store');
  return h;
}

function jsonHeaders() {
  const h = baseHeaders();
  h.set('content-type', 'application/json; charset=utf-8');
  return h;
}

async function handler(req: Request) {
  try {
    // Fast path for HEAD
    if (req.method === 'HEAD') {
      return new Response(null, { status: 204, headers: baseHeaders() });
    }

    // Fast path for probe
    const url = new URL(req.url);
    if (url.searchParams.has('__probe')) {
      return new Response(JSON.stringify({ ok: true, kind: 'router', ts: new Date().toISOString() }), {
        status: 200,
        headers: jsonHeaders(),
      });
    }

    // Import tRPC dependencies
    const { fetchRequestHandler } = await import('@trpc/server/adapters/fetch');
    const { appRouter } = await import('~/server/api/root');
    const { createTRPCContext } = await import('~/server/api/trpc');

    // Handle tRPC request
    return await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: async () => await createTRPCContext({ req }),
      onError({ error, path }) {
        console.error('[tRPC] error', { path, message: error.message });
      },
      responseMeta({ errors }) {
        const headers = baseHeaders();
        return { headers, status: errors?.length ? 200 : undefined };
      },
    });
  } catch (error: any) {
    console.error('[tRPC] handler error:', error?.message || error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'handler-error',
        message: error?.message || 'Unknown error',
      }),
      { status: 200, headers: jsonHeaders() },
    );
  }
}

export { handler as GET, handler as POST, handler as OPTIONS, handler as HEAD };
