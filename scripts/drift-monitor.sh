#!/bin/bash
# Drift monitoring script for automated monitoring and alerting
# This script checks for header drift and origin image drift
set -e

echo "🔍 Running drift monitoring checks..."
echo "Timestamp: $(date -u)"
echo ""

# Check origin parity
echo "📊 Checking origin parity..."
if ./scripts/verify-origins.sh > /dev/null 2>&1; then
    echo "✅ Origin parity: OK"
    ORIGIN_DRIFT=false
else
    echo "❌ Origin parity: FAILED"
    ORIGIN_DRIFT=true
fi

echo ""

# Check CDN parity
echo "📊 Checking CDN parity..."
if ./scripts/cdn-parity.sh > /dev/null 2>&1; then
    echo "✅ CDN parity: OK"
    CDN_DRIFT=false
else
    echo "❌ CDN parity: FAILED"
    CDN_DRIFT=true
fi

echo ""

# Check basic health endpoints
echo "📊 Checking basic health..."
HTML_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://siraj.life)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://siraj.life/api/health)

if [ "$HTML_STATUS" = "200" ]; then
    echo "✅ HTML endpoint: OK ($HTML_STATUS)"
    HTML_HEALTH=true
else
    echo "❌ HTML endpoint: FAILED ($HTML_STATUS)"
    HTML_HEALTH=false
fi

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API endpoint: OK ($API_STATUS)"
    API_HEALTH=true
else
    echo "❌ API endpoint: FAILED ($API_STATUS)"
    API_HEALTH=false
fi

echo ""

# Summary
echo "📋 Summary:"
echo "  Origin drift: $([ "$ORIGIN_DRIFT" = true ] && echo "❌ FAILED" || echo "✅ OK")"
echo "  CDN drift: $([ "$CDN_DRIFT" = true ] && echo "❌ FAILED" || echo "✅ OK")"
echo "  HTML health: $([ "$HTML_HEALTH" = true ] && echo "✅ OK" || echo "❌ FAILED")"
echo "  API health: $([ "$API_HEALTH" = true ] && echo "✅ OK" || echo "❌ FAILED")"

# Exit with error if any drift detected
if [ "$ORIGIN_DRIFT" = true ] || [ "$CDN_DRIFT" = true ] || [ "$HTML_HEALTH" = false ] || [ "$API_HEALTH" = false ]; then
    echo ""
    echo "🚨 DRIFT DETECTED - Alerting required!"
    exit 1
else
    echo ""
    echo "✅ All checks passed - no drift detected"
    exit 0
fi
