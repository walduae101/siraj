# Production Fix Deployment Script for Windows
# This script applies the configuration fix to resolve 500 errors on siraj.life

$ErrorActionPreference = "Stop"

Write-Host "🚀 Siraj Production Fix Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = if ($env:GOOGLE_CLOUD_PROJECT) { $env:GOOGLE_CLOUD_PROJECT } else { "siraj-prod" }
$SERVICE_NAME = "siraj"
$REGION = if ($env:GOOGLE_CLOUD_REGION) { $env:GOOGLE_CLOUD_REGION } else { "us-central1" }
$SECRET_NAME = "siraj-config"

# Function to check if gcloud is installed
function Test-GCloud {
    try {
        $null = Get-Command gcloud -ErrorAction Stop
        Write-Host "✅ gcloud CLI found" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ gcloud CLI is not installed" -ForegroundColor Red
        Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install"
        return $false
    }
}

# Function to check authentication
function Test-Auth {
    Write-Host "Checking Google Cloud authentication..."
    $activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
    
    if ([string]::IsNullOrWhiteSpace($activeAccount)) {
        Write-Host "❌ Not authenticated with Google Cloud" -ForegroundColor Red
        Write-Host "Please run: gcloud auth login"
        return $false
    }
    
    Write-Host "✅ Authenticated as: $activeAccount" -ForegroundColor Green
    return $true
}

# Function to set project
function Set-GCPProject {
    Write-Host "Setting project to: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    Write-Host "✅ Project set" -ForegroundColor Green
}

# Function to apply quick fix
function Apply-QuickFix {
    Write-Host "`nApplying quick fix (disabling rate limiting)..." -ForegroundColor Yellow
    
    gcloud run services update $SERVICE_NAME `
        --region=$REGION `
        --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false" `
        --no-traffic
    
    Write-Host "✅ Quick fix applied (rate limiting disabled)" -ForegroundColor Green
}

# Function to update configuration in Secret Manager
function Update-SecretConfig {
    Write-Host "`nUpdating configuration in Secret Manager..." -ForegroundColor Yellow
    
    # Check if secret exists
    $secretExists = $false
    try {
        gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID 2>$null | Out-Null
        $secretExists = $true
    }
    catch {
        $secretExists = $false
    }
    
    if ($secretExists) {
        Write-Host "Secret exists, adding new version..."
        gcloud secrets versions add $SECRET_NAME `
            --data-file=config.production.json `
            --project=$PROJECT_ID
    }
    else {
        Write-Host "Creating new secret..."
        gcloud secrets create $SECRET_NAME `
            --data-file=config.production.json `
            --project=$PROJECT_ID
        
        # Grant Cloud Run access
        $serviceAccount = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.serviceAccountName)"
        gcloud secrets add-iam-policy-binding $SECRET_NAME `
            --member="serviceAccount:$serviceAccount" `
            --role="roles/secretmanager.secretAccessor" `
            --project=$PROJECT_ID
    }
    
    Write-Host "✅ Secret configuration updated" -ForegroundColor Green
}

# Function to deploy with full configuration
function Deploy-FullFix {
    Write-Host "`nDeploying with full configuration..." -ForegroundColor Yellow
    
    gcloud run services update $SERVICE_NAME `
        --region=$REGION `
        --update-env-vars="RATE_LIMIT_ENABLED=true,RISK_HOLDS_ENABLED=true,PRODUCT_SOT=firestore,RECONCILIATION_ENABLED=true,BACKFILL_ENABLED=true" `
        --project=$PROJECT_ID
    
    Write-Host "✅ Full configuration deployed" -ForegroundColor Green
}

# Function to test endpoints
function Test-Endpoints {
    Write-Host "`nTesting production endpoints..." -ForegroundColor Yellow
    
    $serviceUrl = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
    
    # Test health endpoint
    Write-Host "Testing health endpoint..."
    try {
        $healthResponse = Invoke-WebRequest -Uri "$serviceUrl/api/health" -Method Get -UseBasicParsing
        if ($healthResponse.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint OK" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "❌ Health endpoint failed: $_" -ForegroundColor Red
    }
    
    # Test wallet endpoint
    Write-Host "Testing wallet endpoint..."
    try {
        $walletUrl = "$serviceUrl/api/trpc/points.getWallet?input=%7B%22json%22%3A%7B%22uid%22%3A%22test%22%7D%7D"
        $walletResponse = Invoke-WebRequest -Uri $walletUrl -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✅ Wallet endpoint not returning 500 (status: $($walletResponse.StatusCode))" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 500) {
            Write-Host "❌ Wallet endpoint still returning 500" -ForegroundColor Red
        }
        else {
            Write-Host "✅ Wallet endpoint not returning 500 (status: $($_.Exception.Response.StatusCode))" -ForegroundColor Green
        }
    }
}

# Main execution
function Main {
    Write-Host "This script will fix the production 500 errors on siraj.life"
    Write-Host ""
    
    # Pre-flight checks
    if (-not (Test-GCloud)) { exit 1 }
    if (-not (Test-Auth)) { exit 1 }
    Set-GCPProject
    
    # Check if config file exists
    if (-not (Test-Path "config.production.json")) {
        Write-Host "❌ config.production.json not found" -ForegroundColor Red
        Write-Host "Please ensure you're running this from the project root"
        exit 1
    }
    
    Write-Host "`nChoose deployment option:" -ForegroundColor Yellow
    Write-Host "1) Quick fix only (disable rate limiting)"
    Write-Host "2) Full fix (update configuration in Secret Manager)"
    Write-Host "3) Both (recommended - quick fix first, then full fix)"
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" {
            Apply-QuickFix
        }
        "2" {
            Update-SecretConfig
            Deploy-FullFix
        }
        "3" {
            Apply-QuickFix
            Update-SecretConfig
            Deploy-FullFix
        }
        default {
            Write-Host "Invalid choice" -ForegroundColor Red
            exit 1
        }
    }
    
    # Test the deployment
    Write-Host "`nWaiting 30 seconds for deployment to stabilize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    Test-Endpoints
    
    Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
    Write-Host "Please check https://siraj.life to verify the fix"
}

# Run main function
Main
