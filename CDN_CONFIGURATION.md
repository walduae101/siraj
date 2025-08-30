# CDN Configuration

This document defines the exact CDN configuration that must be maintained for production.

## Current Configuration

### Backend Service Settings

```bash
# Verify current settings
gcloud compute backend-services describe siraj-web-backend --global --format="value(enableCdn,cacheMode,cacheKeyPolicy.includeHost,cacheKeyPolicy.includeProtocol)"
```

**Required Settings:**
- `enableCdn: true`
- `cacheMode: USE_ORIGIN_HEADERS`
- `includeHost: true`
- `includeProtocol: true`

### Cache Key Policy

The CDN cache key includes:
- **Host header** (for multi-domain support)
- **Protocol** (http vs https)
- **Full URL path**

**Excluded from cache key:**
- Query parameters (for static assets)
- User-specific headers

### Negative Caching

**Current:** Disabled (respects origin 404s immediately)

**Optional (safe):**
```bash
# Enable negative caching for 404s (short TTL)
gcloud compute backend-services update siraj-web-backend \
  --global --negative-caching
```

## Header Behavior

### Static Assets (`/_next/static/*`)
- **Cache-Control:** `public, max-age=31536000, immutable`
- **CDN Behavior:** Cache for 1 year, never revalidate
- **Security Headers:** None (assets remain clean)

### HTML Pages (all routes except static/api)
- **Cache-Control:** `no-store`
- **CDN Behavior:** Never cache, always fetch from origin
- **Security Headers:** Full suite applied

### API Routes (`/api/*`)
- **Cache-Control:** `no-store`
- **CDN Behavior:** Never cache, always fetch from origin
- **Security Headers:** Full suite applied

## Verification Commands

### Check CDN Configuration
```bash
# Verify backend service settings
gcloud compute backend-services describe siraj-web-backend --global \
  --format="table(name,enableCdn,cacheMode,cacheKeyPolicy.includeHost,cacheKeyPolicy.includeProtocol)"
```

### Check Cache Key Policy
```bash
# View detailed cache key policy
gcloud compute backend-services get-cache-key-policy siraj-web-backend --global
```

### Test Cache Behavior
```bash
# Test static asset caching
curl -sSI "https://siraj.life/_next/static/chunks/webpack-1f86d5a3fb45aa80.js" | grep -i "cache-control\|age\|etag"

# Test HTML no-cache
curl -sSI "https://siraj.life/" | grep -i "cache-control"
```

## Maintenance

### Cache Invalidation
```bash
# Invalidate all paths
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --quiet

# Invalidate specific paths
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/api/*" --quiet
```

### Monitoring
- **Daily checks:** GitHub Actions workflow runs at 05:30 UTC
- **Post-deploy:** Cloud Build verifies headers after deployment
- **Manual:** Use `scripts/quick-check.sh` for spot checks

## Troubleshooting

### Headers Not Applied
1. Check origin headers: `curl -sSI https://siraj.life --resolve siraj.life:443:34.120.0.0`
2. Verify CDN cache: `curl -sSI https://siraj.life`
3. Invalidate cache if needed
4. Check multi-region parity: `./scripts/verify-origins.sh`

### Static Assets Cached
1. Verify `immutable` header is set
2. Check cache key policy includes host/protocol
3. Ensure negative caching is disabled for 404s

### Performance Issues
1. Monitor CDN hit ratio in Cloud Console
2. Check origin response times
3. Verify cache key policy isn't too restrictive

## Security Considerations

- **Origin headers respected:** CDN never overrides security headers
- **No caching of sensitive content:** API routes and HTML pages use `no-store`
- **Immutable assets:** Static files cached for maximum performance
- **Host validation:** Cache key includes host to prevent cache poisoning
