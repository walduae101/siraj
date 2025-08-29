#!/bin/bash
# Verify CDN parity and correct header serving
# This script checks that the CDN is serving the expected headers for different content types
set -e

echo "🌐 Verifying CDN parity and header serving..."
CDN_URL="https://siraj.life"

# Test HTML page via CDN
echo "📄 Testing HTML page via CDN..."
HTML_HEADERS=$(curl -sSI "$CDN_URL/" -H 'Accept: text/html' | grep -E 'cache-control|content-type|x-mw|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy' | sort)
echo "HTML Headers:"
echo "$HTML_HEADERS"

# Check for expected HTML headers
if echo "$HTML_HEADERS" | grep -q "cache-control.*no-store\|s-maxage"; then
    echo "✅ HTML: Cache-Control present"
else
    echo "❌ HTML: Missing Cache-Control"
    exit 1
fi

if echo "$HTML_HEADERS" | grep -q "content-type.*text/html"; then
    echo "✅ HTML: Content-Type correct"
else
    echo "❌ HTML: Wrong Content-Type"
    exit 1
fi

# Test API endpoint via CDN
echo ""
echo "🔌 Testing API endpoint via CDN..."
API_HEADERS=$(curl -sSI "$CDN_URL/api/health" -H 'Accept: application/json' | grep -E 'content-type|cache-control|x-mw|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy' | sort)
echo "API Headers:"
echo "$API_HEADERS"

# Check for expected API headers
if echo "$API_HEADERS" | grep -q "content-type.*application/json"; then
    echo "✅ API: Content-Type correct (JSON)"
else
    echo "❌ API: Wrong Content-Type (should be JSON)"
    exit 1
fi

if echo "$API_HEADERS" | grep -q "cache-control.*no-store"; then
    echo "✅ API: Cache-Control no-store"
else
    echo "❌ API: Missing no-store Cache-Control"
    exit 1
fi

# Test static chunk via CDN
echo ""
echo "📦 Testing static chunk via CDN..."
CHUNK_PATH=$(curl -sSL "$CDN_URL/" -H 'Accept: text/html' | grep -o '/_next/static/chunks/[^"]\+\.js' | head -n1)

if [ -n "$CHUNK_PATH" ]; then
    echo "Chunk: $CHUNK_PATH"
    CHUNK_HEADERS=$(curl -sSI "$CDN_URL$CHUNK_PATH" | grep -E 'cache-control|content-type|x-static|x-mw' | sort)
    echo "Chunk Headers:"
    echo "$CHUNK_HEADERS"
    
    # Check for expected chunk headers
    if echo "$CHUNK_HEADERS" | grep -q "cache-control.*public.*max-age=31536000.*immutable"; then
        echo "✅ Chunk: Cache-Control immutable"
    else
        echo "❌ Chunk: Wrong Cache-Control (should be immutable)"
        exit 1
    fi
    
    if echo "$CHUNK_HEADERS" | grep -q "content-type.*application/javascript"; then
        echo "✅ Chunk: Content-Type correct (JavaScript)"
    else
        echo "❌ Chunk: Wrong Content-Type (should be JavaScript)"
        exit 1
    fi
    
    if echo "$CHUNK_HEADERS" | grep -q "x-static.*1"; then
        echo "✅ Chunk: x-static header present"
    else
        echo "❌ Chunk: Missing x-static header"
        exit 1
    fi
    
    if echo "$CHUNK_HEADERS" | grep -q "x-mw"; then
        echo "❌ Chunk: Middleware executed (should not)"
        exit 1
    else
        echo "✅ Chunk: No middleware execution (correct)"
    fi
else
    echo "⚠️  Could not find static chunk path"
fi

echo ""
echo "🎯 CDN parity verification complete!"
