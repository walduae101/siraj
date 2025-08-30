import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withProbeHeaders(resp: Response) {
  const h = new Headers(resp.headers);
  h.set('x-trpc-handler', '1');
  h.set('cache-control', 'no-store');
  return new Response(resp.body, { status: resp.status, headers: h });
}

async function handler(req: Request) {
  try {
    // Fast path for HEAD to avoid adapter quirks
    if (req.method === 'HEAD') {
      return new Response(null, {
        status: 204,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-trpc-handler': '1',
        },
      });
    }

    // Optional: probe switch. If ?__probe=1, short-circuit to prove route reached.
    const url = new URL(req.url);
    if (url.searchParams.get('__probe') === '1') {
      return new Response(JSON.stringify({ ok: true, probe: 'trpc-route' }), {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-trpc-handler': '1',
        },
      });
    }

    const resp = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
      onError({ path, error, type }) {
        console.error(
          `[tRPC] onError type=${type} path=${path ?? '(root)'} code=${error.code} msg=${error.message}`
        );
      },
    });

    return withProbeHeaders(resp);
  } catch (e: any) {
    console.error('[tRPC] top-level handler error', e?.stack || e);
    return new Response(JSON.stringify({ error: 'trpc-handler-failed' }), {
      status: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-trpc-handler': '1',
      },
    });
  }
}

export { handler as GET, handler as POST };
export async function HEAD() {
  return new Response(null, {
    status: 204,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-trpc-handler': '1',
    },
  });
}
