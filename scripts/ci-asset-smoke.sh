#!/bin/bash
set -euo pipefail

# CI smoke test to prevent static asset regression
APP_URL="${APP_URL:-https://siraj.life}"
CHUNK_PATH="/_next/static/chunks/webpack.js"

echo "🔍 Testing static asset serving: ${APP_URL}${CHUNK_PATH}"

# Test content-type
ct=$(curl -sSI "${APP_URL}${CHUNK_PATH}" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r')
echo "Content-Type: $ct"

if [[ "$ct" != application/javascript* && "$ct" != text/javascript* ]]; then
  echo "❌ FAIL: static chunk returned non-JS content-type: $ct"
  echo "This indicates static assets are being routed to the app shell"
  exit 1
fi

# Test first few bytes look like JavaScript
first_char=$(curl -fsS "${APP_URL}${CHUNK_PATH}" | head -c 1)
if [[ "$first_char" == "<" ]]; then
  echo "❌ FAIL: chunk body starts with HTML tag"
  exit 1
fi

echo "✅ PASS: asset smoke test passed"
