#!/bin/bash
# Validate next.config.mjs header configuration
# This script checks that the config has the required header groups for security and caching
set -e

echo "🔍 Validating next.config.mjs header configuration..."

CONFIG_FILE="next.config.mjs"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ $CONFIG_FILE not found"
    exit 1
fi

# Check for static assets rule (immutable caching)
if grep -q 'source: "/_next/static/:path\*"' "$CONFIG_FILE" && \
   grep -q 'Cache-Control.*public.*max-age=31536000.*immutable' "$CONFIG_FILE"; then
    echo "✅ Static assets: immutable caching configured"
else
    echo "❌ Static assets: missing or incorrect immutable caching rule"
    exit 1
fi

# Check for API rule (no-store + security headers)
if grep -q 'source: "/api/:path\*"' "$CONFIG_FILE" && \
   grep -q 'Cache-Control.*no-store' "$CONFIG_FILE" && \
   grep -q 'Strict-Transport-Security' "$CONFIG_FILE" && \
   grep -q 'X-Content-Type-Options' "$CONFIG_FILE" && \
   grep -q 'X-Frame-Options' "$CONFIG_FILE"; then
    echo "✅ API routes: no-store + security headers configured"
else
    echo "❌ API routes: missing or incorrect no-store + security headers rule"
    exit 1
fi

# Check for HTML pages rule (no-store + security headers)
if grep -q 'source: "/((?!_next/static|_next/image|fonts|api|favicon.ico|robots.txt|sitemap.xml).\*)"' "$CONFIG_FILE" && \
   grep -q 'Cache-Control.*no-store' "$CONFIG_FILE" && \
   grep -q 'Strict-Transport-Security' "$CONFIG_FILE" && \
   grep -q 'X-Content-Type-Options' "$CONFIG_FILE" && \
   grep -q 'X-Frame-Options' "$CONFIG_FILE"; then
    echo "✅ HTML pages: no-store + security headers configured"
else
    echo "❌ HTML pages: missing or incorrect no-store + security headers rule"
    exit 1
fi

# Check for Vary: Accept on HTML
if grep -q 'Vary.*Accept' "$CONFIG_FILE"; then
    echo "✅ Vary: Accept configured for content negotiation"
else
    echo "❌ Missing Vary: Accept header"
    exit 1
fi

# Check for CSP (should be report-only for now)
if grep -q 'Content-Security-Policy-Report-Only' "$CONFIG_FILE"; then
    echo "✅ CSP: Report-Only mode configured (ready for enforcement)"
else
    echo "❌ Missing Content-Security-Policy-Report-Only header"
    exit 1
fi

echo ""
echo "🎯 next.config.mjs validation complete - all security and caching rules present!"
