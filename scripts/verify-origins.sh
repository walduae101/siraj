#!/bin/bash
# Verify origin parity between US and EU regions
# This script checks that both regions return identical headers for the same content
set -e

echo "🔍 Verifying origin parity between US and EU regions..."

# Get origin URLs
US_ORIGIN=$(gcloud run services describe siraj --region=us-central1 --format="value(status.url)")
EU_ORIGIN=$(gcloud run services describe siraj-eu --region=europe-west1 --format="value(status.url)")

echo "US Origin: $US_ORIGIN"
echo "EU Origin: $EU_ORIGIN"
echo ""

# Test HTML pages
echo "📄 Testing HTML pages..."
US_HTML=$(curl -sSI "$US_ORIGIN/" -H 'Accept: text/html' | grep -E 'cache-control|content-type|x-mw|strict-transport|x-content-type-options|x-frame-options' | sort)
EU_HTML=$(curl -sSI "$EU_ORIGIN/" -H 'Accept: text/html' | grep -E 'cache-control|content-type|x-mw|strict-transport|x-content-type-options|x-frame-options' | sort)

if [ "$US_HTML" = "$EU_HTML" ]; then
    echo "✅ HTML pages: US and EU match"
else
    echo "❌ HTML pages: US and EU differ"
    echo "US: $US_HTML"
    echo "EU: $EU_HTML"
    exit 1
fi

# Test API endpoints
echo ""
echo "🔌 Testing API endpoints..."
US_API=$(curl -sSI "$US_ORIGIN/api/health" -H 'Accept: application/json' | grep -E 'content-type|cache-control|x-mw' | sort)
EU_API=$(curl -sSI "$EU_ORIGIN/api/health" -H 'Accept: application/json' | grep -E 'content-type|cache-control|x-mw' | sort)

if [ "$US_API" = "$EU_API" ]; then
    echo "✅ API endpoints: US and EU match"
else
    echo "❌ API endpoints: US and EU differ"
    echo "US: $US_API"
    echo "EU: $EU_API"
    exit 1
fi

# Test static chunks
echo ""
echo "📦 Testing static chunks..."
CHUNK_PATH=$(curl -sSL "$US_ORIGIN/" -H 'Accept: text/html' | grep -o '/_next/static/chunks/[^"]\+\.js' | head -n1)

if [ -n "$CHUNK_PATH" ]; then
    US_CHUNK=$(curl -sSI "$US_ORIGIN$CHUNK_PATH" | grep -E 'cache-control|content-type|x-static|x-mw' | sort)
    EU_CHUNK=$(curl -sSI "$EU_ORIGIN$CHUNK_PATH" | grep -E 'cache-control|content-type|x-static|x-mw' | sort)
    
    if [ "$US_CHUNK" = "$EU_CHUNK" ]; then
        echo "✅ Static chunks: US and EU match"
        echo "   Chunk: $CHUNK_PATH"
    else
        echo "❌ Static chunks: US and EU differ"
        echo "   Chunk: $CHUNK_PATH"
        echo "US: $US_CHUNK"
        echo "EU: $EU_CHUNK"
        exit 1
    fi
else
    echo "⚠️  Could not find static chunk path"
fi

echo ""
echo "🎯 Origin parity verification complete!"
