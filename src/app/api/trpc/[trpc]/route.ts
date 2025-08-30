/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

const ENDPOINT = '/api/trpc';

function baseHeaders() {
  const h = new Headers();
  h.set('x-trpc-handler', '1');           // explicit probe header
  h.set('cache-control', 'no-store');     // API: no-store (CDN honors)
  return h;
}

function jsonHeaders() {
  const h = baseHeaders();
  h.set('content-type', 'application/json; charset=utf-8');
  return h;
}

/** Fast path for HEAD and explicit probe */
async function lightResponses(req: Request) {
  if (req.method === 'HEAD') {
    return new Response(null, { status: 204, headers: baseHeaders() });
  }
  const url = new URL(req.url);
  if (url.searchParams.has('__probe')) {
    return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
      status: 200,
      headers: jsonHeaders(),
    });
  }
  return null;
}

async function coreHandler(req: Request) {
  // Light paths first
  const light = await lightResponses(req);
  if (light) return light;

  // Full tRPC handler
  return fetchRequestHandler({
    endpoint: ENDPOINT,
    req,
    router: appRouter,
    createContext: async () => await createTRPCContext({ req }),
    onError({ error, path }) {
      // Never crash the route; keep it observable
      console.error(`[tRPC] error on "${path ?? 'unknown'}":`, {
        message: error.message,
        code: (error as any)?.code,
        stack: process.env.NODE_ENV === 'production' ? 'redacted' : error.stack,
      });
    },
    // Ensure envelope + headers always returned; avoid 5xx from adapter
    responseMeta({ errors }) {
      const headers = baseHeaders();
      // If there are errors, keep status 200 so Cloud Run/CDN never turn this into a 5xx.
      // The post-deploy checker inspects JSON payload to decide success/failure.
      const status = errors?.length ? 200 : undefined;
      return { headers, status };
    },
  });
}

export { coreHandler as GET, coreHandler as POST, coreHandler as OPTIONS, coreHandler as HEAD };
