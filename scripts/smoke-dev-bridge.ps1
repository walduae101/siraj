param([int]$Port = 3001)
$Base = "http://127.0.0.1:$Port"

Write-Host "→ proxied public-config ($Base/api/dev-proxy/public-config)"
try {
  $resp = Invoke-WebRequest -Uri "$Base/api/dev-proxy/public-config" -Headers @{Accept='application/json'}
  $txt = $resp.Content
  Write-Output $txt.Substring(0, [Math]::Min(200, $txt.Length))
} catch {
  Write-Output $_.Exception.Message
}

Write-Host "→ local public-config ($Base/api/public-config)"
try {
  $resp = Invoke-WebRequest -Uri "$Base/api/public-config" -Headers @{Accept='application/json'}
  $txt = $resp.Content
  Write-Output $txt.Substring(0, [Math]::Min(200, $txt.Length))
} catch {
  Write-Output $_.Exception.Message
}

Write-Host "→ guard check (expect 403)"
try {
  (Invoke-WebRequest -Uri "$Base/api/dev-proxy/public-config" -Headers @{Host='example.com'}).StatusCode
} catch {
  if ($_.Exception.Response) {
    [int]$status = $_.Exception.Response.StatusCode.Value__
    Write-Output $status
  } else {
    Write-Output "error"
  }
}
