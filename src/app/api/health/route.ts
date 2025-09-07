import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { ok: true, ts: Date.now() }, 
    { headers: { 'cache-control': 'no-store' } }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
