$ErrorActionPreference = "Stop"
Write-Host "== Sprint 2 smoke =="
$apiHead = (curl.exe -sSI https://siraj.life/api/health) | Out-String
if ($apiHead -notmatch "application/json") { throw "API HEAD not JSON" }

Write-Host "tRPC: payments.methods"
$methods = (curl.exe -sS "https://siraj.life/api/trpc/payments.methods?input=%7B%7D") | Out-String
if ($LASTEXITCODE -ne 0) { throw "payments.methods failed" }

Write-Host "tRPC: payments.clientToken"
$token = (curl.exe -sS "https://siraj.life/api/trpc/payments.clientToken?input=%7B%7D") | Out-String
if ($LASTEXITCODE -ne 0) { throw "payments.clientToken failed" }

Write-Host "tRPC: receipts.list (first page)"
$receipts = (curl.exe -sS "https://siraj.life/api/trpc/receipts.list?input=%7B%22page%22:1,%22pageSize%22:20%7D") | Out-String
if ($LASTEXITCODE -ne 0) { throw "receipts.list failed" }

Write-Host "OK: methods+token+receipts"
