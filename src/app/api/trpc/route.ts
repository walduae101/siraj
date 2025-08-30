export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function baseHeaders() {
  const h = new Headers();
  h.set('x-trpc-handler', 'index');       // differentiate index vs router
  h.set('cache-control', 'no-store');
  return h;
}

function jsonHeaders() {
  const h = baseHeaders();
  h.set('content-type', 'application/json; charset=utf-8');
  return h;
}

export async function HEAD() {
  return new Response(null, { status: 204, headers: baseHeaders() });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.has('__probe')) {
    return new Response(JSON.stringify({ ok: true, kind: 'index', ts: new Date().toISOString() }), {
      status: 200,
      headers: jsonHeaders(),
    });
  }
  return new Response(JSON.stringify({ ok: true, kind: 'index', message: 'tRPC index OK' }), {
    status: 200,
    headers: jsonHeaders(),
  });
}
