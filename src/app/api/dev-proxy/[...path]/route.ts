import { NextRequest, NextResponse } from "next/server";
import { isLocalhost, buildUpstreamUrl } from "../../../../config/dev-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const host = req.headers.get("host");
  if (!isLocalhost(host)) {
    return NextResponse.json({ ok: false, error: "forbidden-non-localhost" }, { status: 403 });
  }

  const segments = ctx.params.path ?? [];
  const pathname = segments.join("/");                     // e.g. "public-config" or "trpc"
  const search = req.nextUrl.search || "";                 // "?foo=bar"
  const upstream = buildUpstreamUrl(pathname, search);     // ABSOLUTE URL (fixes the error)

  // Clone headers; never forward local host header
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("x-dev-proxy", "1");

  // Only attach body for non-GET/HEAD
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
    body: (req.method === "GET" || req.method === "HEAD") ? undefined : Buffer.from(await req.arrayBuffer()),
  };

  try {
    const resp = await fetch(upstream, init);
    const outHeaders = new Headers(resp.headers);
    outHeaders.set("x-dev-proxy", "1");
    return new NextResponse(resp.body, { status: resp.status, headers: outHeaders });
  } catch (e: any) {
    // Bubble context to help debug
    return NextResponse.json({ ok: false, upstream, error: e?.message || String(e) }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
