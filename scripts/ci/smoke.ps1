# CI Smoke Test for Siraj Web App (PowerShell)
# Validates: health endpoint, static assets, 404 handling

param(
    [string]$BaseUrl = "https://siraj.life"
)

Write-Host "🧪 Running smoke tests against $BaseUrl..." -ForegroundColor Cyan

# 1. Health endpoint
Write-Host "✅ Testing health endpoint..." -ForegroundColor Green
try {
    $healthResponse = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing
    $healthData = $healthResponse.Content | ConvertFrom-Json
    if ($healthData.status -eq "healthy") {
        Write-Host "   Health endpoint: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Health endpoint returned unexpected status: $($healthData.status)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Static assets (webpack chunks)
Write-Host "✅ Testing static assets..." -ForegroundColor Green
try {
    $staticResponse = Invoke-WebRequest -Uri "$BaseUrl/_next/static/chunks/webpack-*.js" -Method Head -UseBasicParsing
    if ($staticResponse.Headers["Content-Type"] -like "*application/javascript*") {
        Write-Host "   Static assets: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Static assets not serving as JavaScript" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Static assets test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 404 handling (non-existent chunks)
Write-Host "✅ Testing 404 handling..." -ForegroundColor Green
try {
    $notFoundResponse = Invoke-WebRequest -Uri "$BaseUrl/_next/static/chunks/does-not-exist.js" -UseBasicParsing -ErrorAction SilentlyContinue
    $httpCode = $notFoundResponse.StatusCode
} catch {
    $httpCode = $_.Exception.Response.StatusCode.value__
}

if ($httpCode -eq 404 -or $httpCode -eq 403) {
    Write-Host "   404 handling: OK ($httpCode)" -ForegroundColor Green
} else {
    Write-Host "❌ Non-existent chunks returning $httpCode (expected 404/403)" -ForegroundColor Red
    exit 1
}

# 4. CDN headers (if available)
Write-Host "✅ Testing CDN headers..." -ForegroundColor Green
try {
    $cdnResponse = Invoke-WebRequest -Uri "$BaseUrl/_next/static/chunks/webpack-*.js" -Method Head -UseBasicParsing
    $cacheControl = $cdnResponse.Headers["Cache-Control"]
    if ($cacheControl -like "*max-age=31536000*") {
        Write-Host "   CDN cache headers: OK" -ForegroundColor Green
    } else {
        Write-Host "   CDN cache headers: Not detected (may be first request)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   CDN headers test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "🎉 All smoke tests passed!" -ForegroundColor Green
