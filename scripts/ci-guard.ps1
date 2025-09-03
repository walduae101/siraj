# CI Guard Script - Prevents legacy Firebase client imports

Write-Host "Checking for legacy Firebase client imports..." -ForegroundColor Blue

# Check for legacy firebase client imports
$legacyImports = Get-ChildItem -Recurse -Include *.ts,*.tsx src | Select-String -Pattern 'lib/firebase/client(?!\.)' | Where-Object { $_.Path -notmatch 'node_modules' }
if ($legacyImports) {
    Write-Host "ERROR: Legacy Firebase client import found" -ForegroundColor Red
    Write-Host "   Please use '~/lib/firebase.client' instead of '~/lib/firebase/client'" -ForegroundColor Red
    $legacyImports | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber) - $($_.Line)" -ForegroundColor Red }
    exit 1
}

# Check for NEXT_PUBLIC_FIREBASE_* usage in client code only
$firebaseEnvUsage = Get-ChildItem -Recurse -Include *.ts,*.tsx src | Select-String -Pattern 'NEXT_PUBLIC_FIREBASE_' | Where-Object { 
    $_.Path -notmatch 'node_modules' -and 
    $_.Path -notmatch 'env-client' -and 
    $_.Path -notmatch 'env.js' -and 
    $_.Path -notmatch 'env-wrapper' -and
    $_.Path -notmatch 'TEMPLATE_' -and
    $_.Path -notmatch 'config.server' -and
    $_.Path -notmatch 'server-only' -and
    $_.Path -notmatch 'server/'
}
if ($firebaseEnvUsage) {
    Write-Host "ERROR: NEXT_PUBLIC_FIREBASE_* environment variables found in client code" -ForegroundColor Red
    Write-Host "   Please use runtime configuration via /api/public-config instead" -ForegroundColor Red
    $firebaseEnvUsage | ForEach-Object { Write-Host "   $($_.Path):$($_.LineNumber) - $($_.Line)" -ForegroundColor Red }
    exit 1
}

# Auth guards
if (Get-ChildItem -Recurse -Include *.ts,*.tsx src | Select-String -Pattern 'lib\/firebase\/client(?!\.)') {
    Write-Host 'ERROR: legacy firebase client import found' -ForegroundColor Red
    exit 1
}

if (Get-ChildItem -Recurse -Include *.ts,*.tsx src | Select-String -Pattern 'process\.env\.NEXT_PUBLIC_|NEXT_PUBLIC_FIREBASE_') {
    Write-Host 'ERROR: NEXT_PUBLIC_* found in client code' -ForegroundColor Red
    exit 1
}

Write-Host "No legacy Firebase client imports found" -ForegroundColor Green
Write-Host "No NEXT_PUBLIC_FIREBASE_* usage in client code" -ForegroundColor Green
Write-Host "Auth guards passed" -ForegroundColor Green
