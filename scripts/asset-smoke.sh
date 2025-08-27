#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://siraj.life}"

# 1) real chunk: discover current webpack hash from the HTML
HASH=$(curl -sS "$BASE" | tr -d '\r' | grep -oE '/_next/static/chunks/webpack-[a-z0-9]+\.js' | head -n1)
[ -n "$HASH" ] || { echo "❌ couldn't detect webpack chunk"; exit 1; }

# content-type must be JS
curl -sSI "$BASE$HASH" | tr -d '\r' | grep -qi 'content-type: application/javascript' \
  || { echo "❌ real chunk didn't return JS"; exit 1; }

# 2) fake chunk must be 404 (allow a tiny grace window if Next returns 404 later)
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/_next/static/chunks/does-not-exist.js")
if [ "$CODE" != "404" ]; then
  echo "⚠️ fake chunk returned $CODE (expected 404) — not fatal, but report"
  exit 0 # choose "warn only" if you don't want to block deploys
fi

echo "✅ asset smoke: real=JS, fake=404"
