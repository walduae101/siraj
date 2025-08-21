# PowerShell script to update product mapping in Google Secret Manager
# Adds the missing product ID that was causing credits to fail

$PROJECT_ID = "walduae-project-20250809071906"
$SECRET_NAME = "siraj-config"

Write-Host "📦 Updating product mapping in Secret Manager..." -ForegroundColor Cyan

# Get current secret
Write-Host "📥 Fetching current configuration..." -ForegroundColor Yellow
gcloud secrets versions access latest `
  --secret="$SECRET_NAME" `
  --project="$PROJECT_ID" > current-config.json

# Read current config
$currentConfig = Get-Content current-config.json -Raw | ConvertFrom-Json

# Add missing product ID
if (-not $currentConfig.paynow.products."321641745958305792") {
    Write-Host "✏️ Adding missing product ID 321641745958305792..." -ForegroundColor Green
    $currentConfig.paynow.products | Add-Member -Name "321641745958305792" -Value "50" -MemberType NoteProperty
    
    # Save updated config
    $currentConfig | ConvertTo-Json -Depth 10 | Out-File updated-config.json -Encoding UTF8
    
    Write-Host "📊 Product mapping will be updated with:" -ForegroundColor Yellow
    Write-Host "   321641745958305792 = 50 points" -ForegroundColor White
    
    $confirm = Read-Host "❓ Apply these changes to Secret Manager? (y/n)"
    
    if ($confirm -eq 'y') {
        # Create new secret version
        Write-Host "🚀 Creating new secret version..." -ForegroundColor Green
        gcloud secrets versions add "$SECRET_NAME" `
          --data-file=updated-config.json `
          --project="$PROJECT_ID"
        
        Write-Host "✅ Product mapping updated successfully!" -ForegroundColor Green
        Write-Host "⏱️ Cloud Run will pick up the changes within 60 seconds (TTL cache)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Update cancelled" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Product ID 321641745958305792 already exists in mapping" -ForegroundColor Green
}

# Cleanup
Remove-Item -Path current-config.json, updated-config.json -ErrorAction SilentlyContinue
Write-Host "🧹 Cleanup complete" -ForegroundColor Green
