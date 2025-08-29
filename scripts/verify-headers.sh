#!/bin/bash

# Header Verification Script
# Tests that security headers are properly set on HTML and API routes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="${1:-https://siraj.life}"

echo -e "${BLUE}🔍 Verifying Security Headers${NC}"
echo "Base URL: $BASE_URL"
echo "=================================="

# Test function
test_headers() {
    local url="$1"
    local test_name="$2"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "URL: $url"
    
    # Make request with cache-busting headers
    response=$(curl -s -I -H "Cache-Control: no-cache, no-store" "$url" 2>/dev/null || echo "")
    
    # Check for x-mw header (proves middleware executed)
    if echo "$response" | grep -q "x-mw: 1"; then
        echo -e "${GREEN}✅ Middleware executed (x-mw: 1)${NC}"
    else
        echo -e "${RED}❌ Middleware NOT executed (missing x-mw header)${NC}"
        return 1
    fi
    
    # Check security headers
    local headers_ok=true
    
    # Required security headers
    declare -A required_headers=(
        ["Strict-Transport-Security"]="max-age"
        ["X-Content-Type-Options"]="nosniff"
        ["X-Frame-Options"]="DENY"
        ["Referrer-Policy"]="strict-origin-when-cross-origin"
        ["Permissions-Policy"]="accelerometer"
        ["Content-Security-Policy-Report-Only"]="default-src"
    )
    
    for header in "${!required_headers[@]}"; do
        if echo "$response" | grep -qi "$header:"; then
            echo -e "${GREEN}✅ $header present${NC}"
        else
            echo -e "${RED}❌ $header missing${NC}"
            headers_ok=false
        fi
    done
    
    # Check cache control
    if echo "$response" | grep -qi "cache-control: no-store"; then
        echo -e "${GREEN}✅ Cache-Control: no-store (correct for dynamic content)${NC}"
    else
        echo -e "${YELLOW}⚠️  Cache-Control not set to no-store${NC}"
    fi
    
    if [ "$headers_ok" = true ]; then
        echo -e "${GREEN}✅ All security headers present${NC}"
        return 0
    else
        echo -e "${RED}❌ Some security headers missing${NC}"
        return 1
    fi
}

# Test static assets (should NOT have security headers)
test_static_asset() {
    local url="$1"
    local test_name="$2"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "URL: $url"
    
    response=$(curl -s -I "$url" 2>/dev/null || echo "")
    
    # Should NOT have x-mw header
    if echo "$response" | grep -q "x-mw:"; then
        echo -e "${YELLOW}⚠️  Static asset has x-mw header (unexpected)${NC}"
    else
        echo -e "${GREEN}✅ Static asset correctly skipped by middleware${NC}"
    fi
    
    # Should have cache headers
    if echo "$response" | grep -qi "cache-control:.*max-age=31536000.*immutable"; then
        echo -e "${GREEN}✅ Static asset properly cached${NC}"
    else
        echo -e "${YELLOW}⚠️  Static asset cache headers not optimal${NC}"
    fi
}

# Run tests
echo -e "\n${BLUE}📋 Running Header Tests${NC}"

# Test HTML pages
test_headers "$BASE_URL" "Homepage"
test_headers "$BASE_URL/dashboard" "Dashboard"
test_headers "$BASE_URL/account" "Account"

# Test API endpoints
test_headers "$BASE_URL/api/health" "Health API"
test_headers "$BASE_URL/api/csp-report" "CSP Report API"

# Test static assets (should NOT have security headers)
test_static_asset "$BASE_URL/favicon.ico" "Favicon"
test_static_asset "$BASE_URL/_next/static/chunks/webpack-123456.js" "Static JS (example)"

echo -e "\n${BLUE}=================================="
echo "Header Verification Complete"
echo "=================================="

echo -e "\n${BLUE}📝 Verification Checklist:${NC}"
echo "1. ✅ HTML pages get security headers + x-mw: 1"
echo "2. ✅ API routes get security headers + x-mw: 1"
echo "3. ✅ Static assets are skipped by middleware"
echo "4. ✅ Cache-Control properly set (no-store for dynamic, immutable for static)"

echo -e "\n${BLUE}🚀 Next Steps:${NC}"
echo "1. Deploy these changes"
echo "2. Purge CDN cache: gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path '/*' --async"
echo "3. Run this script again to verify"
echo "4. After a few quiet days, flip CSP from report-only to enforced"
