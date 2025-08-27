# Real asset smoke test with actual webpack hash
param(
    [string]$BaseUrl = "https://siraj.life"
)

Write-Host "=== Asset Smoke Test with Real Hashes ===" -ForegroundColor Green

try {
    # Get the actual chunk list
    $diag = Invoke-WebRequest -Uri "$BaseUrl/api/diag/static"
    $diagData = $diag.Content | ConvertFrom-Json
    $webpackFile = $diagData.entries | Where-Object { $_ -like "webpack-*.js" } | Select-Object -First 1
    
    if (-not $webpackFile) {
        Write-Host "❌ No webpack file found in chunks" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Testing real webpack file: $webpackFile" -ForegroundColor Cyan
    
    # Test real webpack chunk
    $webpackUrl = "$BaseUrl/_next/static/chunks/$webpackFile"
    $webpackTest = Invoke-WebRequest -Uri $webpackUrl -Method Head
    
    if ($webpackTest.Headers["Content-Type"] -notmatch "application/javascript") {
        Write-Host "❌ Webpack chunk returned: $($webpackTest.Headers['Content-Type'])" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Real webpack chunk serves JS correctly" -ForegroundColor Green
    
    # Test non-existent chunk (should be 404)
    try {
        $nonExistTest = Invoke-WebRequest -Uri "$BaseUrl/_next/static/chunks/does-not-exist.js" -Method Head
        Write-Host "❌ Non-existent chunk returned $($nonExistTest.StatusCode), expected 404" -ForegroundColor Red
        exit 1
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Non-existent chunk correctly returns 404" -ForegroundColor Green
        } else {
            Write-Host "❌ Non-existent chunk returned $($_.Exception.Response.StatusCode), expected 404" -ForegroundColor Red
            exit 1
        }
    }
    
    # Test API route
    $apiTest = Invoke-WebRequest -Uri "$BaseUrl/api/diag/static"
    if ($apiTest.Content.StartsWith("{")) {
        Write-Host "✅ API route returns JSON" -ForegroundColor Green
    } else {
        Write-Host "❌ API route not returning JSON" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All asset smoke tests PASSED" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Asset smoke test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
