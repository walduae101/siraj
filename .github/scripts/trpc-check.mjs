/* eslint-disable no-console */
import process from 'node:process';

const BASE_URL = process.env.BASE_URL ?? 'https://siraj.life';
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? 30);
const SLEEP_SECONDS = Number(process.env.SLEEP_SECONDS ?? 20);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function head(url) {
  const res = await fetch(url, { method: 'HEAD' });
  return { ok: res.ok, status: res.status, headers: res.headers };
}

async function get(url) {
  const res = await fetch(url);
  let body = null;
  try { body = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, headers: res.headers, body };
}

function ensureHeader(headers, name, predicate, label) {
  const val = headers.get(name);
  if (!predicate(val)) throw new Error(`Missing/invalid header ${name}: ${val} (${label})`);
}

async function attempt(i) {
  console.log(`Attempt ${i}/${MAX_ATTEMPTS}`);

                  // 1) HEAD probe on /api/trpc (router route)
        {
          const r = await head(`${BASE_URL}/api/trpc/_probe`);
          if (!(r.status === 204 || r.status === 200)) throw new Error(`HEAD /api/trpc/_probe status ${r.status}`);
          ensureHeader(r.headers, 'x-trpc-handler', v => v === 'router', 'HEAD /api/trpc/_probe');
          ensureHeader(r.headers, 'cache-control', v => String(v).includes('no-store'), 'HEAD /api/trpc/_probe');
        }

        // 2) Router probe
        {
          const r = await get(`${BASE_URL}/api/trpc/_probe?__probe=1`);
          if (!r.ok) throw new Error(`GET router probe not ok: ${r.status}`);
          ensureHeader(r.headers, 'x-trpc-handler', v => v === 'router', 'GET router probe');
          ensureHeader(r.headers, 'content-type', v => String(v).toLowerCase().includes('application/json'), 'GET router probe');
          if (!r.body?.ok || r.body?.kind !== 'router') throw new Error('Router probe failed');
        }

        // 3) Router probe
        {
          const r = await get(`${BASE_URL}/api/trpc/_probe?__probe=1`);
          if (!r.ok) throw new Error(`GET router probe not ok: ${r.status}`);
          ensureHeader(r.headers, 'x-trpc-handler', v => v === 'router', 'GET router probe');
          ensureHeader(r.headers, 'content-type', v => String(v).toLowerCase().includes('application/json'), 'GET router probe');
          if (!r.body?.ok || r.body?.kind !== 'router') throw new Error('Router probe failed');
        }

          // 4) payments.methods
        {
          const r = await get(`${BASE_URL}/api/trpc/payments.methods?input=%7B%7D`);
          ensureHeader(r.headers, 'x-trpc-handler', v => v === 'router', 'payments.methods');
          ensureHeader(r.headers, 'content-type', v => String(v).toLowerCase().includes('application/json'), 'payments.methods');
          if (!r.body || (r.body.error && r.body.error.code)) throw new Error(`payments.methods error: ${JSON.stringify(r.body)}`);
        }

        // 5) receipts.list page=1 pageSize=2
        {
          const input = encodeURIComponent(JSON.stringify({ page: 1, pageSize: 2 }));
          const r = await get(`${BASE_URL}/api/trpc/receipts.list?input=${input}`);
          ensureHeader(r.headers, 'x-trpc-handler', v => v === 'router', 'receipts.list');
          ensureHeader(r.headers, 'content-type', v => String(v).toLowerCase().includes('application/json'), 'receipts.list');
          if (!r.body || (r.body.error && r.body.error.code)) throw new Error(`receipts.list error: ${JSON.stringify(r.body)}`);
        }
}

(async () => {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      await attempt(i);
      console.log('tRPC checks: ✅ PASS');
      process.exit(0);
    } catch (err) {
      console.warn('tRPC checks: attempt failed:', err?.message ?? err);
      if (i === MAX_ATTEMPTS) break;
      await sleep(SLEEP_SECONDS * 1000);
    }
  }
  console.error('tRPC checks: ❌ FAIL');
  process.exit(1);
})();
