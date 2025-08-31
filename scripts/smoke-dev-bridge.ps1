Write-Host '→ public-config proxied'
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/dev-proxy/public-config' -Headers @{Accept='application/json'}
    $content = $response.Content
    $truncated = $content.Substring(0, [Math]::Min(200, $content.Length))
    Write-Host $truncated
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host '→ local public-config'
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/public-config' -Headers @{Accept='application/json'}
    $content = $response.Content
    $truncated = $content.Substring(0, [Math]::Min(200, $content.Length))
    Write-Host $truncated
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host '→ guard check (expect 403)'
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/dev-proxy/public-config' -Headers @{Host='example.com'}
    Write-Host "Status: $($response.StatusCode)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
}
