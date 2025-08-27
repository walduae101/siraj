#!/usr/bin/env bash
set -euo pipefail
BASE="${1:?base url, e.g. https://siraj.life}"
HDRS="$(curl -sSI "$BASE/_next/static/chunks/webpack.js" | tr -d '\r')"
echo "$HDRS"
echo "$HDRS" | grep -qi 'Content-Type: application/javascript' || { echo "❌ static asset not served as JS"; exit 1; }
echo "✅ static ok"
