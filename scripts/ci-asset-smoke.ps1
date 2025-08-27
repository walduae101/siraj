# CI smoke test to prevent static asset regression
param(
    [string]$AppUrl = "https://siraj.life"
)

$ChunkPath = "/_next/static/chunks/webpack.js"
$FullUrl = "$AppUrl$ChunkPath"

Write-Host "🔍 Testing static asset serving: $FullUrl"

try {
    # Test content-type
    $response = Invoke-WebRequest -Uri $FullUrl -Method Head
    $contentType = $response.Headers["Content-Type"]
    Write-Host "Content-Type: $contentType"

    if ($contentType -notmatch "application/javascript" -and $contentType -notmatch "text/javascript") {
        Write-Host "❌ FAIL: static chunk returned non-JS content-type: $contentType" -ForegroundColor Red
        Write-Host "This indicates static assets are being routed to the app shell" -ForegroundColor Red
        exit 1
    }

    # Test first few bytes look like JavaScript
    $content = Invoke-WebRequest -Uri $FullUrl
    $firstChar = $content.Content.Substring(0, 1)
    if ($firstChar -eq "<") {
        Write-Host "❌ FAIL: chunk body starts with HTML tag" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ PASS: asset smoke test passed" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "❌ FAIL: Error testing asset: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
