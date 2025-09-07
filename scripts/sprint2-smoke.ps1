$ErrorActionPreference = "Stop"
Write-Host "== Sprint 2 smoke =="
$apiHead = (curl.exe -sSI https://siraj.life/api/health) | Out-String
if ($apiHead -notmatch "application/json") { throw "API HEAD not JSON" }

Write-Host "== tRPC payments.methods =="
curl.exe -s "https://siraj.life/api/trpc/payments.methods?input=%7B%7D" | powershell -NoProfile -Command "$input" | Select-Object -First 1

Write-Host "== tRPC payments.clientToken =="
curl.exe -s "https://siraj.life/api/trpc/payments.clientToken?input=%7B%7D" | powershell -NoProfile -Command "$input" | Select-Object -First 1

Write-Host "== tRPC receipts.list (page=1) =="
curl.exe -s "https://siraj.life/api/trpc/receipts.list?input=%7B%22page%22:1,%22pageSize%22:20%7D" | powershell -NoProfile -Command "$input" | Select-Object -First 1
