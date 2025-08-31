Write-Host 'Guard: forbid .env files'
if ((git ls-files) -match '(^|/)\.env(\..*)?$') {
  Write-Error 'ERROR: .env files present'
  exit 1
}

Write-Host 'Guard: forbid process.env in app code'
$hits = Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js -Exclude node_modules,.next,dist,.git | Select-String -Pattern 'process\.env\.[A-Z0-9_]+'
if ($hits) {
  $hits | ForEach-Object { Write-Host $_.Line }
  Write-Error 'ERROR: process.env usage found'
  exit 1
}

Write-Host 'Guards passed'
