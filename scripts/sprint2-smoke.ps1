$ErrorActionPreference = "Stop"
Write-Host "== Sprint 2 smoke =="
$apiHead = (curl.exe -sSI https://siraj.life/api/health) | Out-String
if ($apiHead -notmatch "application/json") { throw "API HEAD not JSON" }
$methods = (curl.exe -sS https://siraj.life/api/trpc/payments.methods) | Out-String
if ($LASTEXITCODE -ne 0) { throw "payments.methods failed" }
$token = (curl.exe -sS https://siraj.life/api/trpc/payments.clientToken) | Out-String
if ($LASTEXITCODE -ne 0) { throw "payments.clientToken failed" }
Write-Host "OK: methods+token"
