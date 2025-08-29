#!/bin/bash
set -euo pipefail

# CI Smoke Test for Siraj Web App
# Validates: health endpoint, static assets, 404 handling

BASE="https://siraj.life"

echo "🧪 Running smoke tests against $BASE..."

# 1. Health endpoint
echo "✅ Testing health endpoint..."
curl -sS "$BASE/health" | jq -e '.status=="healthy"' >/dev/null
echo "   Health endpoint: OK"

# 2. Static assets (webpack chunks)
echo "✅ Testing static assets..."
STATIC_RESPONSE=$(curl -sSI "$BASE/_next/static/chunks/webpack-*.js" | head -n 10)
echo "$STATIC_RESPONSE" | grep -iq 'content-type: application/javascript' || {
    echo "❌ Static assets not serving as JavaScript"
    exit 1
}
echo "   Static assets: OK"

# 3. 404 handling (non-existent chunks)
echo "✅ Testing 404 handling..."
HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/_next/static/chunks/does-not-exist.js")
if [[ "$HTTP_CODE" =~ ^(404|403)$ ]]; then
    echo "   404 handling: OK ($HTTP_CODE)"
else
    echo "❌ Non-existent chunks returning $HTTP_CODE (expected 404/403)"
    exit 1
fi

# 4. CDN headers (if available)
echo "✅ Testing CDN headers..."
CDN_HEADERS=$(curl -sSI "$BASE/_next/static/chunks/webpack-*.js" | grep -i 'cache-control\|age\|x-cache' || true)
if echo "$CDN_HEADERS" | grep -q 'max-age=31536000'; then
    echo "   CDN cache headers: OK"
else
    echo "   CDN cache headers: Not detected (may be first request)"
fi

echo "🎉 All smoke tests passed!"
