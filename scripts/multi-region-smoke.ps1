# Multi-region chunk smoke test for Phase 7 (PowerShell version)
# Usage: .\scripts\multi-region-smoke.ps1

param(
    [string[]]$Regions = @(
        "https://siraj-btmgk7htca-uc.a.run.app",  # US Central
        "https://siraj-btmgk7htca-ew.a.run.app"   # Europe West (if exists)
    )
)

Write-Host "=== Multi-Region Chunk Smoke Test ===" -ForegroundColor Cyan

foreach ($BASE in $Regions) {
    Write-Host "Testing region: $BASE" -ForegroundColor Yellow
    
    # Check if service is reachable
    try {
        $null = Invoke-WebRequest -Uri "$BASE/health" -TimeoutSec 10 -ErrorAction Stop
    }
    catch {
        Write-Host "⚠️  $BASE: Service unreachable, skipping" -ForegroundColor Yellow
        continue
    }
    
    try {
        # Extract webpack chunk hash from HTML
        $htmlContent = (Invoke-WebRequest -Uri $BASE -TimeoutSec 10).Content
        $hashMatch = [regex]::Match($htmlContent, '/_next/static/chunks/webpack-[a-z0-9]+\.js')
        
        if (-not $hashMatch.Success) {
            Write-Host "❌ $BASE: No webpack chunk found in HTML" -ForegroundColor Red
            exit 1
        }
        
        $hash = $hashMatch.Value
        
        # Test chunk content-type
        $chunkResponse = Invoke-WebRequest -Uri "$BASE$hash" -Method Head -TimeoutSec 10
        $contentType = $chunkResponse.Headers["Content-Type"]
        
        if ($contentType -notmatch "application/javascript") {
            Write-Host "❌ $BASE: Chunk not JS ($contentType)" -ForegroundColor Red
            Write-Host "   Chunk URL: $BASE$hash" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ $BASE: $hash → $contentType" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $BASE: Error testing chunk - $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All regions serving chunks correctly" -ForegroundColor Green
