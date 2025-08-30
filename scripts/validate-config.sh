#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node is required for validation."
  exit 1
fi

node .github/scripts/validate-next-config.mjs
