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

    // For now, just return a simple response to test the route
    return new Response(JSON.stringify({ ok: true, message: 'tRPC route working' }), {
      status: 200,
      headers: jsonHeaders(),
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
