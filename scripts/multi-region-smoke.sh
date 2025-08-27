#!/usr/bin/env bash
set -euo pipefail

# Multi-region chunk smoke test for Phase 7
# Usage: ./scripts/multi-region-smoke.sh

# Define region endpoints (update with your actual Cloud Run URLs)
BASES=(
  "https://siraj-btmgk7htca-uc.a.run.app"  # US Central
  "https://siraj-btmgk7htca-ew.a.run.app"  # Europe West (if exists)
)

echo "=== Multi-Region Chunk Smoke Test ==="

for BASE in "${BASES[@]}"; do
  echo "Testing region: $BASE"
  
  # Check if service is reachable
  if ! curl -s --max-time 10 "$BASE/health" > /dev/null 2>&1; then
    echo "⚠️  $BASE: Service unreachable, skipping"
    continue
  fi
  
  # Extract webpack chunk hash from HTML
  HASH=$(curl -sS --max-time 10 "$BASE" | tr -d '\r' | grep -oE '/_next/static/chunks/webpack-[a-z0-9]+\.js' | head -n1)
  
  if [ -z "$HASH" ]; then
    echo "❌ $BASE: No webpack chunk found in HTML"
    exit 1
  fi
  
  # Test chunk content-type
  CT=$(curl -sSI --max-time 10 "$BASE$HASH" | tr -d '\r' | grep -i '^content-type:' | awk '{print tolower($2)}')
  
  if [[ "$CT" != application/javascript* ]]; then
    echo "❌ $BASE: Chunk not JS ($CT)"
    echo "   Chunk URL: $BASE$HASH"
    exit 1
  fi
  
  echo "✅ $BASE: $HASH → $CT"
done

echo "✅ All regions serving chunks correctly"
