#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-3001}"
BASE="http://127.0.0.1:${PORT}"

echo "→ proxied public-config (${BASE}/api/dev-proxy/public-config)"
curl -sS -H 'Accept: application/json' "${BASE}/api/dev-proxy/public-config" | head -c 200; echo

echo "→ local public-config (${BASE}/api/public-config)"
curl -sS -H 'Accept: application/json' "${BASE}/api/public-config" | head -c 200; echo

echo "→ guard check (expect 403)"
curl -si -H 'Host: example.com' "${BASE}/api/dev-proxy/public-config" | head -n 1
