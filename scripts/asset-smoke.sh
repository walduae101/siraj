#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://siraj.life}"

HASH=$(curl -sS "$BASE" | tr -d '\r' | grep -oE '/_next/static/chunks/webpack-[a-z0-9]+\.js' | head -n1)
[ -n "$HASH" ] || { echo "❌ no webpack chunk found in HTML"; exit 1; }

CT=$(curl -sSI "$BASE$HASH" | tr -d '\r' | grep -i '^content-type:' | awk '{print tolower($2)}')
[[ "$CT" == application/javascript* ]] || { echo "❌ real chunk is not JS ($CT)"; exit 1; }

echo "✅ real chunk served as JS"

# Optional: Check that fake chunk returns 404 (warn only to avoid blocking deploys)
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/_next/static/chunks/does-not-exist.js")
if [ "$CODE" != "404" ]; then
  echo "⚠️ fake chunk returned $CODE (expected 404) — not fatal, but report"
else
  echo "✅ fake chunk correctly returns 404"
fi
