#!/bin/bash

# CI Guard Script - Prevent mock data and .env regressions
set -e

echo "🔍 Running CI guards..."

# Check for mock data patterns
echo "Checking for mock data patterns..."
if grep -r -i "msw\|mock\|handlers\|__mocks__\|faker\|testdata\|stub" src/ --exclude-dir=node_modules; then
  echo "❌ Found mock data patterns in src/"
  exit 1
fi

# Check for .env files
echo "Checking for .env files..."
if find . -name ".env*" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
  echo "❌ Found .env files"
  find . -name ".env*" -not -path "./node_modules/*" -not -path "./.git/*"
  exit 1
fi

# Check for process.env usage in app code (allow in Next.js internals)
echo "Checking for process.env usage..."
if grep -r "process\.env" src/ --exclude-dir=node_modules | grep -v "NODE_ENV" | grep -v "npm_package_version"; then
  echo "❌ Found process.env usage in app code"
  grep -r "process\.env" src/ --exclude-dir=node_modules | grep -v "NODE_ENV" | grep -v "npm_package_version"
  exit 1
fi

# Check for MSW dependencies
echo "Checking for MSW dependencies..."
if grep -q "msw\|@mswjs" package.json; then
  echo "❌ Found MSW dependencies in package.json"
  exit 1
fi

echo "✅ All CI guards passed!"
