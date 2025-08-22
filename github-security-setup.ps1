# GitHub Security Configuration Script
# Configures all security settings for the Siraj repository

Write-Host "🔧 Configuring GitHub Security Settings..." -ForegroundColor Cyan

# Check if GitHub CLI is available
try {
    $ghVersion = gh --version
    Write-Host "✅ GitHub CLI available: $($ghVersion[0])" -ForegroundColor Green
    $useGH = $true
} catch {
    Write-Host "⚠️  GitHub CLI not available - using manual instructions" -ForegroundColor Yellow
    $useGH = $false
}

if ($useGH) {
    Write-Host "`n🛡️ Enabling repository security features..." -ForegroundColor Cyan
    
    # Enable vulnerability alerts
    Write-Host "Enabling vulnerability alerts..."
    try {
        gh api repos/walduae101/siraj/vulnerability-alerts -X PUT
        Write-Host "✅ Vulnerability alerts enabled" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to enable vulnerability alerts: $_" -ForegroundColor Red
    }
    
    # Enable automated security fixes  
    Write-Host "Enabling automated security fixes..."
    try {
        gh api repos/walduae101/siraj/automated-security-fixes -X PUT
        Write-Host "✅ Automated security fixes enabled" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to enable automated security fixes: $_" -ForegroundColor Red
    }
    
    # Configure branch protection for main
    Write-Host "Setting up branch protection for main..."
    $protectionConfig = @{
        required_status_checks = @{
            strict = $true
            contexts = @("Security Scan", "Dependency Security")
        }
        enforce_admins = $false
        required_pull_request_reviews = @{
            required_approving_review_count = 1
            dismiss_stale_reviews = $true
            require_code_owner_reviews = $false
        }
        restrictions = $null
        allow_force_pushes = $false
        allow_deletions = $false
        required_conversation_resolution = $true
    } | ConvertTo-Json -Depth 10
    
    try {
        $protectionConfig | gh api repos/walduae101/siraj/branches/main/protection -X PUT --input -
        Write-Host "✅ Branch protection configured" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to configure branch protection: $_" -ForegroundColor Red
        Write-Host "   Manual setup required at: https://github.com/walduae101/siraj/settings/branches" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "`n📋 Manual GitHub Security Setup Required:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/walduae101/siraj/settings/security_analysis" -ForegroundColor White
    Write-Host "   - Enable Secret scanning" -ForegroundColor White
    Write-Host "   - Enable Push protection" -ForegroundColor White
    Write-Host "   - Enable Dependabot alerts" -ForegroundColor White
    Write-Host "   - Enable Code scanning" -ForegroundColor White
    Write-Host "`n2. Go to: https://github.com/walduae101/siraj/settings/branches" -ForegroundColor White
    Write-Host "   - Add protection rule for 'main' branch" -ForegroundColor White
    Write-Host "   - Require pull request reviews (1 approval)" -ForegroundColor White
    Write-Host "   - Require status checks to pass" -ForegroundColor White
    Write-Host "   - Block force pushes and deletions" -ForegroundColor White
}

Write-Host "`n✅ GitHub security configuration script complete!" -ForegroundColor Green
