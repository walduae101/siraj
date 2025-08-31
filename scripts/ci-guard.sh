#!/usr/bin/env bash
set -euo pipefail

if git ls-files | grep -E '(^|/)\.env(\..*)?$' >/dev/null; then
  echo 'ERROR: .env files present'
  exit 1
fi

if grep -R --line-number --exclude-dir node_modules --exclude-dir .next --exclude-dir dist --exclude-dir .git -E 'process\.env\.[A-Z0-9_]+' src app 2>/dev/null; then
  echo 'ERROR: process.env usage found'
  exit 1
fi

echo 'Guards passed'
