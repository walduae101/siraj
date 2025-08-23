# Quick Config Update Script
# This script helps you quickly update your config.json with real API keys

Write-Host "🔧 Quick Config Update for Siraj" -ForegroundColor Blue
Write-Host ""

# Read current config
$configPath = "c:\var\secrets\siraj\config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json

Write-Host "📊 Current Configuration:" -ForegroundColor Yellow
Write-Host "PayNow API Key: $($config.paynow.apiKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host "PayNow Store ID: $($config.paynow.storeId)" -ForegroundColor Green
Write-Host "Environment: $($config.features.ENVIRONMENT)" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Let's update the missing configuration..." -ForegroundColor Blue
Write-Host ""

# PayNow Products
Write-Host "=== PayNow Products ===" -ForegroundColor Blue
Write-Host "You need to create products in PayNow and get their IDs." -ForegroundColor Yellow
Write-Host "Go to PayNow Merchant Portal > Products to create these:" -ForegroundColor Yellow
Write-Host ""

$points20 = Read-Host "Enter PayNow Product ID for 20 points (or press Enter to skip)"
if ($points20) { $config.paynow.products.points_20 = $points20 }

$points50 = Read-Host "Enter PayNow Product ID for 50 points (or press Enter to skip)"
if ($points50) { $config.paynow.products.points_50 = $points50 }

$points150 = Read-Host "Enter PayNow Product ID for 150 points (or press Enter to skip)"
if ($points150) { $config.paynow.products.points_150 = $points150 }

$points500 = Read-Host "Enter PayNow Product ID for 500 points (or press Enter to skip)"
if ($points500) { $config.paynow.products.points_500 = $points500 }

# Authentication
Write-Host ""
Write-Host "=== Authentication ===" -ForegroundColor Blue
$nextAuthUrl = Read-Host "Enter your domain URL (e.g., https://your-domain.com) (or press Enter to skip)"
if ($nextAuthUrl) { $config.auth.nextAuthUrl = $nextAuthUrl }

$googleClientId = Read-Host "Enter Google OAuth Client ID (or press Enter to skip)"
if ($googleClientId) { $config.auth.googleClientId = $googleClientId }

$googleClientSecret = Read-Host "Enter Google OAuth Client Secret (or press Enter to skip)"
if ($googleClientSecret) { $config.auth.googleClientSecret = $googleClientSecret }

# Firebase
Write-Host ""
Write-Host "=== Firebase ===" -ForegroundColor Blue
$firebaseProjectId = Read-Host "Enter Firebase Project ID (or press Enter to skip)"
if ($firebaseProjectId) { $config.firebase.projectId = $firebaseProjectId }

# OpenAI
Write-Host ""
Write-Host "=== OpenAI ===" -ForegroundColor Blue
$openaiKey = Read-Host "Enter OpenAI API Key (or press Enter to skip)"
if ($openaiKey) { $config.openai.apiKey = $openaiKey }

# Generate new cron secret
Write-Host ""
Write-Host "=== Cron Secret ===" -ForegroundColor Blue
$generateCron = Read-Host "Generate new cron secret? (y/n)"
if ($generateCron -eq "y" -or $generateCron -eq "Y") {
    $newCronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $config.subscriptions.cronSecret = $newCronSecret
    Write-Host "✅ New cron secret generated: $newCronSecret" -ForegroundColor Green
}

# Environment
Write-Host ""
Write-Host "=== Environment ===" -ForegroundColor Blue
$environment = Read-Host "Set environment to (test/staging/prod) (or press Enter to keep current: $($config.features.ENVIRONMENT))"
if ($environment) { $config.features.ENVIRONMENT = $environment }

# Save config
Write-Host ""
Write-Host "💾 Saving updated configuration..." -ForegroundColor Yellow
$config | ConvertTo-Json -Depth 10 | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. Upload to Google Secret Manager:"
Write-Host "   gcloud secrets versions add siraj-config --data-file='$configPath'"
Write-Host ""
Write-Host "2. Test your application:"
Write-Host "   npm run build"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "🔍 To view your updated config:" -ForegroundColor Blue
Write-Host "Get-Content '$configPath' | ConvertFrom-Json | ConvertTo-Json -Depth 10"
