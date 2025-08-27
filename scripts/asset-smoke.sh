#!/usr/bin/env bash
set -euo pipefail

# Multi-region smoke test - blocks bad deploys before traffic flip
BASES=("${@:-https://siraj.life}")

for BASE in "${BASES[@]}"; do
  echo "Testing: $BASE"
  
  # Extract current webpack chunk from HTML
  HTML=$(curl -sS "$BASE")
  CHUNK=$(printf "%s" "$HTML" | tr -d '\r' | grep -oE '/_next/static/chunks/webpack-[a-z0-9]+\.js' | head -n1)
  test -n "$CHUNK" || { echo "❌ $BASE no webpack chunk in HTML"; exit 1; }
  
  # Verify chunk serves as JS
  CT=$(curl -sSI "$BASE$CHUNK" | tr -d '\r' | awk 'tolower($1$2)=="content-type:"{print tolower($2)}')
  [[ "$CT" == application/javascript* ]] || { echo "❌ $BASE chunk not JS ($CT)"; exit 1; }
  
  echo "✅ $BASE ok ($CHUNK)"
done

echo "✅ All regions serving chunks correctly"
