# Siraj Daily Health Check Script
# Run this script daily to verify system health

# Set environment variables
$env:PROJECT_ID = "walduae-project-20250809071906"
$env:US_SERVICE = "siraj"
$env:US_REGION = "us-central1"
$env:EU_SERVICE = "siraj-eu"
$env:EU_REGION = "europe-west1"

Write-Host "🔍 Siraj Daily Health Check" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Get origin URLs
$US_ORIGIN = gcloud run services describe $env:US_SERVICE --region $env:US_REGION --format='value(status.url)'
$EU_ORIGIN = gcloud run services describe $env:EU_SERVICE --region $env:EU_REGION --format='value(status.url)'

Write-Host "`n📍 Origin Health Checks:" -ForegroundColor Yellow
Write-Host "US: $US_ORIGIN" -ForegroundColor Cyan
Write-Host "EU: $EU_ORIGIN" -ForegroundColor Cyan

# Health endpoint checks
Write-Host "`n🏥 Health Endpoints:" -ForegroundColor Yellow
$US_HEALTH = curl.exe -sSI "$US_ORIGIN/api/health" 2>$null
$EU_HEALTH = curl.exe -sSI "$EU_ORIGIN/api/health" 2>$null

$US_HEALTH | Select-String -Pattern "^(HTTP|cache-control|content-type|strict-transport)" | ForEach-Object { Write-Host "  US: $_" -ForegroundColor Green }
$EU_HEALTH | Select-String -Pattern "^(HTTP|cache-control|content-type|strict-transport)" | ForEach-Object { Write-Host "  EU: $_" -ForegroundColor Green }

# tRPC endpoint checks
Write-Host "`n🔌 tRPC Endpoints:" -ForegroundColor Yellow
$US_TRPC = curl.exe -sS "$US_ORIGIN/api/trpc/payments.methods?input=%7B%7D" -i 2>$null
$EU_TRPC = curl.exe -sS "$EU_ORIGIN/api/trpc/payments.methods?input=%7B%7D" -i 2>$null

$US_TRPC | Select-String -Pattern "^(HTTP|x-trpc-handler|content-type|cache-control)" | ForEach-Object { Write-Host "  US: $_" -ForegroundColor Green }
$EU_TRPC | Select-String -Pattern "^(HTTP|x-trpc-handler|content-type|cache-control)" | ForEach-Object { Write-Host "  EU: $_" -ForegroundColor Green }

# CDN checks
Write-Host "`n🌐 CDN Checks:" -ForegroundColor Yellow
$CDN_HTML = curl.exe -sSI "https://siraj.life" 2>$null
$CDN_API = curl.exe -sS "https://siraj.life/api/trpc/payments.methods?input=%7B%7D" -i 2>$null

$CDN_HTML | Select-String -Pattern "^(HTTP|cache-control|content-type|vary|strict-transport)" | ForEach-Object { Write-Host "  HTML: $_" -ForegroundColor Green }
$CDN_API | Select-String -Pattern "^(HTTP|x-trpc-handler|content-type|cache-control)" | ForEach-Object { Write-Host "  API: $_" -ForegroundColor Green }

# Static asset check
Write-Host "`n📦 Static Asset Check:" -ForegroundColor Yellow
$HTML_CONTENT = curl.exe -s "https://siraj.life" 2>$null
$ASSET = $HTML_CONTENT | Select-String -Pattern '/_next/static/(chunks|app)/[^"]+\.js' | Select-Object -First 1 | ForEach-Object { $_.Matches[0].Value }

if ($ASSET) {
    Write-Host "  Asset: $ASSET" -ForegroundColor Cyan
    $ASSET_HEADERS = curl.exe -sSI "https://siraj.life$ASSET" 2>$null
    $ASSET_HEADERS | Select-String -Pattern "^(HTTP|cache-control|content-type|age|etag)" | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
} else {
    Write-Host "  ❌ No static asset found" -ForegroundColor Red
}

# Image parity check
Write-Host "`n🖼️ Image Parity Check:" -ForegroundColor Yellow
$US_IMAGE = gcloud run services describe $env:US_SERVICE --region $env:US_REGION --format='value(spec.template.spec.containers[0].image)'
$EU_IMAGE = gcloud run services describe $env:EU_SERVICE --region $env:EU_REGION --format='value(spec.template.spec.containers[0].image)'

Write-Host "  US: $US_IMAGE" -ForegroundColor Cyan
Write-Host "  EU: $EU_IMAGE" -ForegroundColor Cyan

if ($US_IMAGE -eq $EU_IMAGE) {
    Write-Host "  ✅ Images match" -ForegroundColor Green
} else {
    Write-Host "  ❌ Images differ - EU drift detected!" -ForegroundColor Red
    Write-Host "  Run: gcloud run services update $env:EU_SERVICE --region $env:EU_REGION --image `"$US_IMAGE`"" -ForegroundColor Yellow
}

Write-Host "`n✅ Daily check complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
