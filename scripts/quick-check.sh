#!/bin/bash
# Quick re-check commands for monitoring
# Run this anytime to verify headers/caching are working correctly
set -e

echo "🔍 Quick header and caching verification..."
echo ""

# HTML via CDN: expect no-store + security headers
echo "📄 HTML via CDN:"
curl -sSI https://siraj.life | grep -E -i '^(HTTP|cache-control|content-type|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy|vary)' || echo "No matching headers found"

echo ""

# API via CDN: HEAD + GET signatures
echo "🔌 API via CDN (HEAD):"
curl -sSI https://siraj.life/api/health | grep -E -i '^(HTTP|cache-control|content-type)' || echo "No matching headers found"

echo ""

echo "🔌 API via CDN (GET):"
curl -sS https://siraj.life/api/health | head -c 200; echo ""

echo ""

# One real chunk: expect immutable + JS content-type (no security headers)
echo "📦 Static chunk via CDN:"
ASSET=$(curl -s https://siraj.life | grep -oE '/_next/static/(chunks|app)/[^"]+\.js' | head -1)
if [ -n "$ASSET" ]; then
    echo "Testing: $ASSET"
    curl -sSI "https://siraj.life$ASSET" | grep -E -i '^(HTTP|cache-control|content-type|age|etag)' || echo "No matching headers found"
else
    echo "Could not find static chunk"
fi

echo ""
echo "✅ Quick check complete!"
