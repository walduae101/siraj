export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, ts: Date.now() }, { 
    headers: { 
      'cache-control': 'no-store',
      'x-ping-handler': 'ping'
    } 
  });
}
