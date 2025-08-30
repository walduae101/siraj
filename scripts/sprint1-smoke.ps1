# HTML
curl -sSI https://siraj.life | Select-String -Pattern 'HTTP|cache-control|content-type|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy' -CaseSensitive:$false

# API
curl -sSI https://siraj.life/api/health | Select-String -Pattern 'HTTP|cache-control|content-type' -CaseSensitive:$false

# Receipts (expect JSON via tRPC)
curl -sS https://siraj.life/api/trpc/receipts.list
