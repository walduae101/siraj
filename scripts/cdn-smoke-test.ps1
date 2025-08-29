# CDN Smoke Test Script (PowerShell)
# Validates security headers, caching headers, and performance requirements

param(
    [string]$BaseUrl = "https://siraj.life",
    [int]$Timeout = 30,
    [int]$MaxResponseTime = 1200  # 1.2 seconds in milliseconds
)

# Test results tracking
$script:TESTS_PASSED = 0
$script:TESTS_FAILED = 0
$script:TOTAL_TESTS = 0

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
    $script:TESTS_PASSED++
    $script:TOTAL_TESTS++
}

function Write-Error {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:TESTS_FAILED++
    $script:TOTAL_TESTS++
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

# Test function
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$TestName,
        [int]$ExpectedStatus = 200
    )
    
    Write-Info "Testing: $TestName ($Url)"
    
    try {
        # Make request and capture response
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -UserAgent "CDN-Smoke-Test/1.0" -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $responseTime = $response.BaseResponse.ResponseTime
        $responseSize = $response.Content.Length
        
        # Test status code
        if ($statusCode -eq $ExpectedStatus) {
            Write-Success "Status code: $statusCode (expected: $ExpectedStatus)"
        } else {
            Write-Error "Status code: $statusCode (expected: $ExpectedStatus)"
        }
        
        # Test response time
        if ($responseTime -lt $MaxResponseTime) {
            Write-Success "Response time: ${responseTime}ms (max: ${MaxResponseTime}ms)"
        } else {
            Write-Error "Response time: ${responseTime}ms (max: ${MaxResponseTime}ms)"
        }
        
        # Test security headers
        Test-SecurityHeaders $response.Headers $Url
        
        # Test caching headers
        Test-CachingHeaders $response.Headers $Url
        
    } catch {
        Write-Error "Request failed: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

# Test security headers
function Test-SecurityHeaders {
    param(
        [hashtable]$Headers,
        [string]$Url
    )
    
    # Required security headers
    $requiredHeaders = @{
        "Strict-Transport-Security" = "max-age"
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY"
        "Referrer-Policy" = "strict-origin-when-cross-origin"
        "Permissions-Policy" = "geolocation"
        "Content-Security-Policy-Report-Only" = "default-src"
    }
    
    foreach ($header in $requiredHeaders.Keys) {
        if ($Headers.ContainsKey($header)) {
            Write-Success "Security header present: $header"
        } else {
            Write-Error "Security header missing: $header"
        }
    }
}

# Test caching headers
function Test-CachingHeaders {
    param(
        [hashtable]$Headers,
        [string]$Url
    )
    
    if ($Url -match "\.(js|css|png|jpg|ico)$") {
        # Static assets should have cache headers
        if ($Headers.ContainsKey("Cache-Control")) {
            $cacheControl = $Headers["Cache-Control"]
            if ($cacheControl -match "immutable|max-age") {
                Write-Success "Static asset caching: $cacheControl"
            } else {
                Write-Warning "Static asset may not be cached optimally: $cacheControl"
            }
        } else {
            Write-Error "Static asset missing cache-control header"
        }
    } else {
        # HTML and API responses should have no-store
        if ($Headers.ContainsKey("Cache-Control")) {
            $cacheControl = $Headers["Cache-Control"]
            if ($cacheControl -match "no-store|no-cache") {
                Write-Success "Dynamic content no-cache: $cacheControl"
            } else {
                Write-Warning "Dynamic content may be cached: $cacheControl"
            }
        } else {
            Write-Warning "Dynamic content missing cache-control header"
        }
    }
}

# Main test execution
function Main {
    Write-Host "🚀 Starting CDN Smoke Tests" -ForegroundColor Cyan
    Write-Host "Base URL: $BaseUrl"
    Write-Host "Max response time: ${MaxResponseTime}ms"
    Write-Host "=================================="
    Write-Host ""
    
    # Test main pages
    Test-Endpoint "$BaseUrl" "Homepage"
    Test-Endpoint "$BaseUrl/dashboard" "Dashboard"
    Test-Endpoint "$BaseUrl/account" "Account"
    
    # Test API endpoints
    Test-Endpoint "$BaseUrl/api/health" "Health Check"
    Test-Endpoint "$BaseUrl/api/csp-report" "CSP Report Endpoint"
    
    # Test static assets
    Test-Endpoint "$BaseUrl/favicon.ico" "Favicon"
    
    # Test error pages (expect 404)
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/404" -TimeoutSec $Timeout -UserAgent "CDN-Smoke-Test/1.0"
        if ($response.StatusCode -eq 404) {
            Write-Success "404 Page returns correct status"
        } else {
            Write-Error "404 Page returns status: $($response.StatusCode)"
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Success "404 Page returns correct status"
        } else {
            Write-Error "404 Page test failed: $($_.Exception.Message)"
        }
    }
    
    Write-Host "=================================="
    Write-Host "📊 Test Summary" -ForegroundColor Cyan
    Write-Host "Total tests: $script:TOTAL_TESTS"
    Write-Host "Passed: $script:TESTS_PASSED"
    Write-Host "Failed: $script:TESTS_FAILED"
    Write-Host "Warnings: $($script:TOTAL_TESTS - $script:TESTS_PASSED - $script:TESTS_FAILED)"
    Write-Host ""
    
    if ($script:TESTS_FAILED -eq 0) {
        Write-Host "✅ All critical tests passed!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ $($script:TESTS_FAILED) tests failed" -ForegroundColor Red
        exit 1
    }
}

# Run main function
Main
