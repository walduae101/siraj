import { NextRequest, NextResponse } from "next/server";
import { isLocalhost, buildUpstreamUrl } from "../../../../config/dev-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const host = req.headers.get("host");
  if (!isLocalhost(host)) {
    return NextResponse.json({ ok: false, error: "forbidden-non-localhost" }, { status: 403 });
  }

  const { path } = await ctx.params;
  const segments = path ?? [];
  const pathname = segments.join("/");
  const search = req.nextUrl.search || "";
  const upstream = buildUpstreamUrl(pathname, search);

  // Build outbound request
  const headers = new Headers();
  headers.set("accept", "application/json");              // <-- force JSON
  headers.set("x-dev-proxy", "1");
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
    body: (req.method === "GET" || req.method === "HEAD") ? undefined : Buffer.from(await req.arrayBuffer()),
    cache: "no-store",
  };

  try {
    const resp = await fetch(upstream, init);
    const ct = resp.headers.get("content-type") || "";
    const outHeaders = new Headers(resp.headers);
    outHeaders.set("x-dev-proxy", "1");

    // If upstream is not JSON, surface a clear JSON error (and a tiny body sample)
    if (!ct.toLowerCase().includes("application/json")) {
      const sample = (await resp.text()).slice(0, 256);
      return NextResponse.json(
        { ok: false, error: "upstream-non-json", status: resp.status, contentType: ct, url: upstream, sample },
        { status: 502, headers: outHeaders }
      );
    }

    // Pass-through JSON body/status/headers
    const bodyText = await resp.text();
    outHeaders.set("content-type", "application/json");
    return new NextResponse(bodyText, { status: resp.status, headers: outHeaders });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "upstream-fetch-failed", message: e?.message ?? String(e), url: upstream }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS, handler as HEAD };
