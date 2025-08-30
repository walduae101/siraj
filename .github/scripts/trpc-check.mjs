/* tRPC post-deploy checks against production */
const BASE = process.env.BASE_URL || "https://siraj.life";
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS || 30); // ~10min
const SLEEP_SECONDS = Number(process.env.SLEEP_SECONDS || 20);

const enc = encodeURIComponent;
const urls = {
  head: `${BASE}/api/trpc`,
  methods: `${BASE}/api/trpc/payments.methods?input=${enc("{}")}`,
  token: `${BASE}/api/trpc/payments.clientToken?input=${enc("{}")}`,
  receipts: `${BASE}/api/trpc/receipts.list?input=${enc(JSON.stringify({ page: 1, pageSize: 20 }))}`,
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWith(method, url) {
  const res = await fetch(url, { method, redirect: "manual" });
  const text = await res.text(); // always capture body for diagnostics
  return { res, text };
}

function assertHeader(res, name, predicate, msg) {
  const val = res.headers.get(name);
  if (!predicate(val)) throw new Error(`${msg} (header ${name}="${val}")`);
  return val;
}

function parseTRPCEnvelope(text) {
  // Expect tRPC envelope: {"result": {"data": ...}} or {"error": {...}}
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`Response not JSON: ${text.slice(0, 200)}`);
  }
  if (json.error)
    throw new Error(`tRPC error: ${JSON.stringify(json.error).slice(0, 200)}`);
  if (!json.result || typeof json.result !== "object")
    throw new Error(`No tRPC result envelope: ${text.slice(0, 200)}`);
  return json.result.data;
}

async function checkOnce() {
  // 1) HEAD /api/trpc
  {
    const { res } = await fetchWith("HEAD", urls.head);
    if (res.status !== 204)
      throw new Error(`HEAD /api/trpc expected 204, got ${res.status}`);
    assertHeader(
      res,
      "x-trpc-handler",
      (v) => v === "1",
      "x-trpc-handler header missing",
    );
    assertHeader(
      res,
      "cache-control",
      (v) => v?.toLowerCase().includes("no-store"),
      "no-store missing on HEAD",
    );
  }

  // 2) payments.methods
  {
    const { res, text } = await fetchWith("GET", urls.methods);
    if (res.status !== 200)
      throw new Error(`payments.methods status ${res.status}`);
    assertHeader(
      res,
      "content-type",
      (v) => v?.includes("application/json"),
      "content-type not application/json",
    );
    assertHeader(
      res,
      "cache-control",
      (v) => v?.toLowerCase().includes("no-store"),
      "no-store missing",
    );
    assertHeader(
      res,
      "x-trpc-handler",
      (v) => v === "1",
      "x-trpc-handler header missing",
    );
    const data = parseTRPCEnvelope(text);
    if (typeof data !== "object") throw new Error("methods: data not object");
    if (!("enabled" in data)) throw new Error("methods: enabled field missing");
    if (!Array.isArray(data.methods) && data.enabled)
      throw new Error("methods: methods array missing when enabled");
  }

  // 3) payments.clientToken
  {
    const { res, text } = await fetchWith("GET", urls.token);
    if (res.status !== 200)
      throw new Error(`payments.clientToken status ${res.status}`);
    assertHeader(
      res,
      "content-type",
      (v) => v?.includes("application/json"),
      "content-type not application/json",
    );
    assertHeader(
      res,
      "cache-control",
      (v) => v?.toLowerCase().includes("no-store"),
      "no-store missing",
    );
    assertHeader(
      res,
      "x-trpc-handler",
      (v) => v === "1",
      "x-trpc-handler header missing",
    );
    const data = parseTRPCEnvelope(text);
    if (typeof data !== "object")
      throw new Error("clientToken: data not object");
    if (!("enabled" in data))
      throw new Error("clientToken: enabled field missing");
    if (data.enabled && !data.token)
      throw new Error("clientToken: token missing when enabled");
  }

  // 4) receipts.list
  {
    const { res, text } = await fetchWith("GET", urls.receipts);
    if (res.status !== 200)
      throw new Error(`receipts.list status ${res.status}`);
    assertHeader(
      res,
      "content-type",
      (v) => v?.includes("application/json"),
      "content-type not application/json",
    );
    assertHeader(
      res,
      "cache-control",
      (v) => v?.toLowerCase().includes("no-store"),
      "no-store missing",
    );
    assertHeader(
      res,
      "x-trpc-handler",
      (v) => v === "1",
      "x-trpc-handler header missing",
    );
    const data = parseTRPCEnvelope(text);
    if (typeof data !== "object")
      throw new Error("receipts.list: data not object");
  }
}

(async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `tRPC post-deploy check attempt ${attempt}/${MAX_ATTEMPTS} @ ${new Date().toISOString()}`,
      );
      await checkOnce();
      console.log("✅ tRPC checks passed");
      process.exit(0);
    } catch (e) {
      console.warn(`⚠️  ${e.message || e}`);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(SLEEP_SECONDS * 1000);
        continue;
      }
      console.error("❌ tRPC checks failed after retries");
      process.exit(1);
    }
  }
})();
