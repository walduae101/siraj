# Security Headers Deployment Guide

## Overview

This guide covers the deployment and verification of the bulletproof security headers implementation that stamps headers **before** CDN caching.

## What Changed

### 1. **Middleware (`/middleware.ts`)**
- **Location**: Root of repo (not in `src/`)
- **Matcher**: `["/:path*"]` (matches everything, middleware filters)
- **Function**: `isHtmlOrApi()` filters out static assets
- **Headers**: All security headers + temporary `x-mw: 1` for verification

### 2. **CSP Report Endpoint (`/src/app/api/csp-report/route.ts`)**
- **Simplified**: Minimal logging to avoid noise
- **Safe**: Returns `{ok: true}` regardless of parsing errors

### 3. **Next.js Config (`next.config.mjs`)**
- **Focus**: Caching rules only (security headers moved to middleware)
- **Static**: `immutable` cache for assets
- **Dynamic**: `no-store` for HTML/API

## Deployment Steps

### 1. **Deploy Changes**
```bash
# Deploy to staging first
git push origin main

# Verify Cloud Build pipeline passes
# - TypeScript compilation ✅
# - Biome linting ✅
# - CDN smoke tests ✅
```

### 2. **Purge CDN Cache**
```bash
# Purge all paths to ensure fresh responses
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --async

# Verify purge completed
gcloud compute url-maps describe siraj-web-map --format="value(status.urlMap.status)"
```

### 3. **Verify Headers**
```bash
# Run verification script
./scripts/verify-headers.sh

# Or test manually
curl -I https://siraj.life/ -H "Cache-Control: no-cache, no-store"
curl -I https://siraj.life/api/health -H "Cache-Control: no-cache, no-store"
```

## Verification Checklist

### ✅ **HTML Pages**
- [ ] `x-mw: 1` header present (proves middleware executed)
- [ ] `Strict-Transport-Security` present
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `X-Frame-Options: DENY` present
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` present
- [ ] `Permissions-Policy` present
- [ ] `Content-Security-Policy-Report-Only` present
- [ ] `Cache-Control: no-store` present

### ✅ **API Routes**
- [ ] Same headers as HTML pages
- [ ] `x-mw: 1` header present

### ✅ **Static Assets**
- [ ] **NO** `x-mw` header (correctly skipped)
- [ ] **NO** security headers (not needed)
- [ ] `Cache-Control: public, max-age=31536000, immutable` present

## Troubleshooting

### **Headers Missing**
1. **Check middleware placement**: Must be at repo root (`/middleware.ts`)
2. **Check matcher**: Should be `["/:path*"]`
3. **Check deployment**: Ensure changes were deployed
4. **Purge cache**: CDN might be serving cached responses

### **x-mw Header Missing**
- Middleware not executing
- Check file location and matcher
- Verify deployment picked up changes

### **Static Assets Have Headers**
- Middleware filtering not working
- Check `isHtmlOrApi()` function
- Verify file extensions are excluded

## CSP Policy Evolution

### **Current (Report-Only)**
```javascript
Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;
```

### **Next Steps (After 7 Days)**
1. **Monitor CSP reports** for violations
2. **Fix violations** in code
3. **Flip to enforced**:
   ```javascript
   // In middleware.ts
   res.headers.delete("Content-Security-Policy-Report-Only");
   res.headers.set("Content-Security-Policy", "<same policy>");
   ```

## Monitoring

### **CSP Reports**
- Check logs for CSP violations
- Monitor `/api/csp-report` endpoint
- Look for patterns in violations

### **Performance Impact**
- Monitor response times
- Check for middleware overhead
- Verify CDN caching still works

### **Security Headers**
- Use verification script in CI
- Monitor for missing headers
- Alert on security regressions

## Rollback Plan

### **Quick Rollback**
```bash
# Revert middleware changes
git revert <commit-hash>

# Deploy
git push origin main

# Purge cache
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --async
```

### **Partial Rollback**
- Remove `x-mw` header (keep security headers)
- Disable CSP (keep other headers)
- Revert specific header changes

## Success Criteria

- [ ] All HTML/API routes have security headers
- [ ] Static assets are properly cached
- [ ] No CSP violations in production
- [ ] Performance impact < 10ms
- [ ] CDN caching working correctly
- [ ] Verification script passes in CI

## Next Phase

After successful deployment and 7 days of monitoring:

1. **Flip CSP to enforced**
2. **Remove `x-mw` header** (no longer needed)
3. **Tighten CSP policy** (remove `unsafe-inline`, `unsafe-eval`)
4. **Add more security headers** as needed
