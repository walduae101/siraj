# Interactive Config Update Script for Siraj
# This script helps you update config.json with real API keys and secrets

param(
    [string]$ConfigPath = "c:\var\secrets\siraj\config.json",
    [switch]$SkipPrompts
)

Write-Host "🔧 Interactive Config Update for Siraj" -ForegroundColor Blue
Write-Host "This script will help you update your config.json with real API keys and secrets" -ForegroundColor Blue
Write-Host ""

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Function to read current config
function Read-Config {
    param([string]$Path)
    
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw
        return $content | ConvertFrom-Json
    } else {
        Write-Host "❌ Config file not found at: $Path" -ForegroundColor $Red
        exit 1
    }
}

# Function to save config
function Save-Config {
    param(
        [object]$Config,
        [string]$Path
    )
    
    $Config | ConvertTo-Json -Depth 10 | Out-File -FilePath $Path -Encoding UTF8
    Write-Host "✅ Config saved to: $Path" -ForegroundColor $Green
}

# Read current config
Write-Host "📋 Reading current configuration..." -ForegroundColor $Yellow
$config = Read-Config -Path $ConfigPath

Write-Host "✅ Current config loaded" -ForegroundColor $Green
Write-Host ""

# Display current values
Write-Host "📊 Current Configuration Summary:" -ForegroundColor $Blue
Write-Host "PayNow API Key: $($config.paynow.apiKey.Substring(0, [Math]::Min(20, $config.paynow.apiKey.Length)))..." -ForegroundColor $Yellow
Write-Host "PayNow Store ID: $($config.paynow.storeId)" -ForegroundColor $Yellow
Write-Host "Environment: $($config.features.ENVIRONMENT)" -ForegroundColor $Yellow
Write-Host ""

if (-not $SkipPrompts) {
    Write-Host "🔧 Interactive Configuration Update" -ForegroundColor $Blue
    Write-Host "Press Enter to keep current values, or enter new values when prompted." -ForegroundColor $Yellow
    Write-Host ""

    # PayNow Configuration
    Write-Host "=== PayNow Configuration ===" -ForegroundColor $Blue
    $newApiKey = Read-Host "Enter PayNow API Key (or press Enter to keep current)"
    if ($newApiKey) {
        $config.paynow.apiKey = $newApiKey
        Write-Host "✅ PayNow API Key updated" -ForegroundColor $Green
    }

    $newWebhookSecret = Read-Host "Enter PayNow Webhook Secret (or press Enter to keep current)"
    if ($newWebhookSecret) {
        $config.paynow.webhookSecret = $newWebhookSecret
        Write-Host "✅ PayNow Webhook Secret updated" -ForegroundColor $Green
    }

    $newStoreId = Read-Host "Enter PayNow Store ID (or press Enter to keep current)"
    if ($newStoreId) {
        $config.paynow.storeId = $newStoreId
        Write-Host "✅ PayNow Store ID updated" -ForegroundColor $Green
    }

    # PayNow Products
    Write-Host ""
    Write-Host "=== PayNow Products ===" -ForegroundColor $Blue
    Write-Host "Current products: $($config.paynow.products | ConvertTo-Json)" -ForegroundColor $Yellow
    
    $addProducts = Read-Host "Do you want to add/update PayNow products? (y/n)"
    if ($addProducts -eq "y" -or $addProducts -eq "Y") {
        $config.paynow.products = @{}
        
        $points20 = Read-Host "Enter PayNow Product ID for 20 points (or press Enter to skip)"
        if ($points20) { $config.paynow.products.points_20 = $points20 }
        
        $points50 = Read-Host "Enter PayNow Product ID for 50 points (or press Enter to skip)"
        if ($points50) { $config.paynow.products.points_50 = $points50 }
        
        $points150 = Read-Host "Enter PayNow Product ID for 150 points (or press Enter to skip)"
        if ($points150) { $config.paynow.products.points_150 = $points150 }
        
        $points500 = Read-Host "Enter PayNow Product ID for 500 points (or press Enter to skip)"
        if ($points500) { $config.paynow.products.points_500 = $points500 }
        
        Write-Host "✅ PayNow products updated" -ForegroundColor $Green
    }

    # Authentication Configuration
    Write-Host ""
    Write-Host "=== Authentication Configuration ===" -ForegroundColor $Blue
    $newNextAuthUrl = Read-Host "Enter NextAuth URL (e.g., https://your-domain.com) (or press Enter to keep current)"
    if ($newNextAuthUrl) {
        $config.auth.nextAuthUrl = $newNextAuthUrl
        Write-Host "✅ NextAuth URL updated" -ForegroundColor $Green
    }

    $newGoogleClientId = Read-Host "Enter Google OAuth Client ID (or press Enter to keep current)"
    if ($newGoogleClientId) {
        $config.auth.googleClientId = $newGoogleClientId
        Write-Host "✅ Google Client ID updated" -ForegroundColor $Green
    }

    $newGoogleClientSecret = Read-Host "Enter Google OAuth Client Secret (or press Enter to keep current)"
    if ($newGoogleClientSecret) {
        $config.auth.googleClientSecret = $newGoogleClientSecret
        Write-Host "✅ Google Client Secret updated" -ForegroundColor $Green
    }

    # Firebase Configuration
    Write-Host ""
    Write-Host "=== Firebase Configuration ===" -ForegroundColor $Blue
    $newFirebaseProjectId = Read-Host "Enter Firebase Project ID (or press Enter to keep current)"
    if ($newFirebaseProjectId) {
        $config.firebase.projectId = $newFirebaseProjectId
        Write-Host "✅ Firebase Project ID updated" -ForegroundColor $Green
    }

    $firebaseServiceAccountPath = Read-Host "Enter path to Firebase service account JSON file (or press Enter to skip)"
    if ($firebaseServiceAccountPath -and (Test-Path $firebaseServiceAccountPath)) {
        $serviceAccountContent = Get-Content $firebaseServiceAccountPath -Raw
        $config.firebase.serviceAccountJson = $serviceAccountContent
        Write-Host "✅ Firebase service account JSON updated" -ForegroundColor $Green
    }

    # OpenAI Configuration
    Write-Host ""
    Write-Host "=== OpenAI Configuration ===" -ForegroundColor $Blue
    $newOpenAiKey = Read-Host "Enter OpenAI API Key (or press Enter to keep current)"
    if ($newOpenAiKey) {
        $config.openai.apiKey = $newOpenAiKey
        Write-Host "✅ OpenAI API Key updated" -ForegroundColor $Green
    }

    # Subscription Plans
    Write-Host ""
    Write-Host "=== Subscription Plans ===" -ForegroundColor $Blue
    Write-Host "Current plans: $($config.subscriptions.plans | ConvertTo-Json)" -ForegroundColor $Yellow
    
    $addPlans = Read-Host "Do you want to add/update subscription plans? (y/n)"
    if ($addPlans -eq "y" -or $addPlans -eq "Y") {
        $config.subscriptions.plans = @{}
        
        # Basic Monthly
        $basicMonthlyName = Read-Host "Enter name for Basic Monthly plan (or press Enter for default: 'Basic Monthly')"
        if (-not $basicMonthlyName) { $basicMonthlyName = "Basic Monthly" }
        $basicMonthlyPoints = Read-Host "Enter points per cycle for Basic Monthly (or press Enter for default: 50)"
        if (-not $basicMonthlyPoints) { $basicMonthlyPoints = 50 }
        $config.subscriptions.plans.basic_monthly = @{
            name = $basicMonthlyName
            cycle = "month"
            pointsPerCycle = [int]$basicMonthlyPoints
        }
        
        # Basic Yearly
        $basicYearlyName = Read-Host "Enter name for Basic Yearly plan (or press Enter for default: 'Basic Yearly')"
        if (-not $basicYearlyName) { $basicYearlyName = "Basic Yearly" }
        $basicYearlyPoints = Read-Host "Enter points per cycle for Basic Yearly (or press Enter for default: 600)"
        if (-not $basicYearlyPoints) { $basicYearlyPoints = 600 }
        $config.subscriptions.plans.basic_yearly = @{
            name = $basicYearlyName
            cycle = "year"
            pointsPerCycle = [int]$basicYearlyPoints
        }
        
        # Premium Monthly
        $premiumMonthlyName = Read-Host "Enter name for Premium Monthly plan (or press Enter for default: 'Premium Monthly')"
        if (-not $premiumMonthlyName) { $premiumMonthlyName = "Premium Monthly" }
        $premiumMonthlyPoints = Read-Host "Enter points per cycle for Premium Monthly (or press Enter for default: 150)"
        if (-not $premiumMonthlyPoints) { $premiumMonthlyPoints = 150 }
        $config.subscriptions.plans.premium_monthly = @{
            name = $premiumMonthlyName
            cycle = "month"
            pointsPerCycle = [int]$premiumMonthlyPoints
        }
        
        # Premium Yearly
        $premiumYearlyName = Read-Host "Enter name for Premium Yearly plan (or press Enter for default: 'Premium Yearly')"
        if (-not $premiumYearlyName) { $premiumYearlyName = "Premium Yearly" }
        $premiumYearlyPoints = Read-Host "Enter points per cycle for Premium Yearly (or press Enter for default: 1800)"
        if (-not $premiumYearlyPoints) { $premiumYearlyPoints = 1800 }
        $config.subscriptions.plans.premium_yearly = @{
            name = $premiumYearlyName
            cycle = "year"
            pointsPerCycle = [int]$premiumYearlyPoints
        }
        
        Write-Host "✅ Subscription plans updated" -ForegroundColor $Green
    }

    # Generate new cron secret
    Write-Host ""
    Write-Host "=== Cron Secret ===" -ForegroundColor $Blue
    $generateCronSecret = Read-Host "Do you want to generate a new cron secret? (y/n)"
    if ($generateCronSecret -eq "y" -or $generateCronSecret -eq "Y") {
        $newCronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        $config.subscriptions.cronSecret = $newCronSecret
        Write-Host "✅ New cron secret generated: $newCronSecret" -ForegroundColor $Green
    }

    # Fraud Detection Configuration
    Write-Host ""
    Write-Host "=== Fraud Detection Configuration ===" -ForegroundColor $Blue
    $newRecaptchaSiteKey = Read-Host "Enter reCAPTCHA Enterprise Site Key (or press Enter to keep current)"
    if ($newRecaptchaSiteKey) {
        $config.fraud.recaptchaSiteKey = $newRecaptchaSiteKey
        Write-Host "✅ reCAPTCHA Site Key updated" -ForegroundColor $Green
    }

    $newRecaptchaProject = Read-Host "Enter reCAPTCHA Project ID (or press Enter to keep current)"
    if ($newRecaptchaProject) {
        $config.fraud.recaptchaProject = $newRecaptchaProject
        Write-Host "✅ reCAPTCHA Project ID updated" -ForegroundColor $Green
    }

    $newAppCheckKey = Read-Host "Enter Firebase App Check Public Key (or press Enter to keep current)"
    if ($newAppCheckKey) {
        $config.fraud.appCheckPublicKeys = @($newAppCheckKey)
        Write-Host "✅ App Check Public Key updated" -ForegroundColor $Green
    }

    # Environment Configuration
    Write-Host ""
    Write-Host "=== Environment Configuration ===" -ForegroundColor $Blue
    $newEnvironment = Read-Host "Enter environment (test/staging/prod) (or press Enter to keep current: $($config.features.ENVIRONMENT))"
    if ($newEnvironment) {
        $config.features.ENVIRONMENT = $newEnvironment
        Write-Host "✅ Environment updated to: $newEnvironment" -ForegroundColor $Green
    }

    # Fraud Shadow Mode
    $fraudShadowMode = Read-Host "Enable fraud shadow mode? (y/n) (current: $($config.features.FRAUD_SHADOW_MODE))"
    if ($fraudShadowMode -eq "y" -or $fraudShadowMode -eq "Y") {
        $config.features.FRAUD_SHADOW_MODE = $true
        Write-Host "✅ Fraud shadow mode enabled" -ForegroundColor $Green
    } elseif ($fraudShadowMode -eq "n" -or $fraudShadowMode -eq "N") {
        $config.features.FRAUD_SHADOW_MODE = $false
        Write-Host "✅ Fraud shadow mode disabled" -ForegroundColor $Green
    }
}

# Save the updated config
Write-Host ""
Write-Host "💾 Saving updated configuration..." -ForegroundColor $Yellow
Save-Config -Config $config -Path $ConfigPath

Write-Host ""
Write-Host "🎉 Configuration update completed!" -ForegroundColor $Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor $Blue
Write-Host "1. Review your updated configuration:"
Write-Host "   Get-Content '$ConfigPath' | ConvertFrom-Json | ConvertTo-Json -Depth 10"
Write-Host ""
Write-Host "2. Upload to Google Secret Manager:"
Write-Host "   gcloud secrets versions add siraj-config --data-file='$ConfigPath'"
Write-Host ""
Write-Host "3. Test your application:"
Write-Host "   npm run build"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "🔍 To view your updated config:" -ForegroundColor $Blue
Write-Host "Get-Content '$ConfigPath' | ConvertFrom-Json | ConvertTo-Json -Depth 10"
