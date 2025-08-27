#!/usr/bin/env bash
set -euo pipefail
BASE="${1:?Base URL, e.g. https://siraj.life}"

echo "Checking webpack chunk content-type…"
HDRS="$(curl -sSI "$BASE/_next/static/chunks/webpack.js" | tr -d '\r')"
echo "$HDRS"
echo "$HDRS" | grep -qi 'Content-Type: application/javascript' \
  || { echo "❌ static asset not served as JS"; exit 1; }

echo "Checking nonexistent chunk returns 404…"
NCODE="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/_next/static/chunks/does-not-exist.js")"
[ "$NCODE" = "404" ] || { echo "❌ expected 404 for missing chunk, got $NCODE"; exit 1; }

echo "Checking API route returns JSON…"
curl -sS "$BASE/api/diag/static" | head -c 200 | grep -q '{' || { echo "❌ API route not returning JSON"; exit 1; }

echo "✅ asset smoke tests passed"
