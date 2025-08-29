#!/bin/bash

# CDN Smoke Test Script
# Validates security headers, caching headers, and performance requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://siraj.life}"
TIMEOUT=30
MAX_RESPONSE_TIME=1200  # 1.2 seconds in milliseconds

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test function
test_endpoint() {
    local url="$1"
    local test_name="$2"
    local expected_status="${3:-200}"
    
    log_info "Testing: $test_name ($url)"
    
    # Make request and capture response
    response=$(curl -s -w "\n%{http_code}\n%{time_total}\n%{size_download}" \
        -H "User-Agent: CDN-Smoke-Test/1.0" \
        --max-time $TIMEOUT \
        "$url" 2>/dev/null || echo -e "\n000\n999\n0")
    
    # Parse response
    body=$(echo "$response" | head -n -3)
    status_code=$(echo "$response" | tail -n 3 | head -n 1)
    response_time=$(echo "$response" | tail -n 2 | head -n 1)
    response_size=$(echo "$response" | tail -n 1)
    
    # Convert response time to milliseconds
    response_time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null || echo "999")
    
    # Get headers
    headers=$(curl -s -I -H "User-Agent: CDN-Smoke-Test/1.0" \
        --max-time $TIMEOUT \
        "$url" 2>/dev/null || echo "")
    
    # Test status code
    if [ "$status_code" = "$expected_status" ]; then
        log_success "Status code: $status_code (expected: $expected_status)"
    else
        log_error "Status code: $status_code (expected: $expected_status)"
    fi
    
    # Test response time
    if (( $(echo "$response_time_ms < $MAX_RESPONSE_TIME" | bc -l) )); then
        log_success "Response time: ${response_time_ms}ms (max: ${MAX_RESPONSE_TIME}ms)"
    else
        log_error "Response time: ${response_time_ms}ms (max: ${MAX_RESPONSE_TIME}ms)"
    fi
    
    # Test security headers
    test_security_headers "$headers" "$url"
    
    # Test caching headers based on content type
    test_caching_headers "$headers" "$url"
    
    echo ""
}

# Test security headers
test_security_headers() {
    local headers="$1"
    local url="$2"
    
    # Check for x-mw header (proves middleware executed)
    if echo "$headers" | grep -qi "x-mw: 1"; then
        log_success "Middleware executed (x-mw: 1)"
    else
        log_error "Middleware NOT executed (missing x-mw header)"
    fi
    
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
        if echo "$headers" | grep -qi "$header:"; then
            log_success "Security header present: $header"
        else
            log_error "Security header missing: $header"
        fi
    done
}

# Test caching headers
test_caching_headers() {
    local headers="$1"
    local url="$2"
    
    # Determine content type
    content_type=$(echo "$headers" | grep -i "content-type:" | head -n 1 || echo "")
    
    if [[ "$url" == *".js" ]] || [[ "$url" == *".css" ]] || [[ "$url" == *".png" ]] || [[ "$url" == *".jpg" ]] || [[ "$url" == *".ico" ]]; then
        # Static assets should have cache headers
        if echo "$headers" | grep -qi "cache-control:"; then
            cache_control=$(echo "$headers" | grep -i "cache-control:" | head -n 1)
            if echo "$cache_control" | grep -qi "immutable\|max-age"; then
                log_success "Static asset caching: $cache_control"
            else
                log_warning "Static asset may not be cached optimally: $cache_control"
            fi
        else
            log_error "Static asset missing cache-control header"
        fi
    else
        # HTML and API responses should have no-store
        if echo "$headers" | grep -qi "cache-control:"; then
            cache_control=$(echo "$headers" | grep -i "cache-control:" | head -n 1)
            if echo "$cache_control" | grep -qi "no-store\|no-cache"; then
                log_success "Dynamic content no-cache: $cache_control"
            else
                log_warning "Dynamic content may be cached: $cache_control"
            fi
        else
            log_warning "Dynamic content missing cache-control header"
        fi
    fi
}

# Main test execution
main() {
    echo "🚀 Starting CDN Smoke Tests"
    echo "Base URL: $BASE_URL"
    echo "Max response time: ${MAX_RESPONSE_TIME}ms"
    echo "=================================="
    echo ""
    
    # Test main pages
    test_endpoint "$BASE_URL" "Homepage"
    test_endpoint "$BASE_URL/dashboard" "Dashboard"
    test_endpoint "$BASE_URL/account" "Account"
    
    # Test API endpoints
    test_endpoint "$BASE_URL/api/health" "Health Check"
    test_endpoint "$BASE_URL/api/csp-report" "CSP Report Endpoint"
    
    # Test static assets
    test_endpoint "$BASE_URL/favicon.ico" "Favicon"
    
    # Test error pages
    test_endpoint "$BASE_URL/404" "404 Page" "404"
    
    echo "=================================="
    echo "📊 Test Summary"
    echo "Total tests: $TOTAL_TESTS"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Warnings: $((TOTAL_TESTS - TESTS_PASSED - TESTS_FAILED))"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All critical tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $TESTS_FAILED tests failed${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
