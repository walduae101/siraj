# Golden Headers Contract

This document defines the exact header behavior that must be maintained for production.

## Header Requirements by Surface

| Surface                              | Must-have                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| HTML (/)                             | `Cache-Control: no-store` · `Content-Type: text/html; charset=utf-8` · **all security headers** · `Vary: Accept` |
| API (/api/health)                    | `Cache-Control: no-store` · `Content-Type: application/json; charset=utf-8` · **all security headers**           |
| Static chunk (`/_next/static/...js`) | `Cache-Control: public, max-age=31536000, immutable` · `x-static: 1` · **no** security headers                   |

## Security Headers (Required on HTML & API)

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()`
- `Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;`

## Daily Spot-Check Commands

```bash
# HTML
curl -sSI https://siraj.life | egrep -i '^(HTTP|cache-control|content-type|vary|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy)'

# API
curl -sSI https://siraj.life/api/health | egrep -i '^(HTTP|cache-control|content-type)'

# Real chunk (immutable)
ASSET=$(curl -s https://siraj.life | grep -oE '/_next/static/(chunks|app)/[^"]+\.js' | head -1)
curl -sSI "https://siraj.life$ASSET" | egrep -i '^(HTTP|cache-control|content-type|age|etag)'
```

## Expected Results

### HTML Response
```
HTTP/2 200
cache-control: no-store
content-type: text/html; charset=utf-8
vary: Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()
content-security-policy-report-only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;
```

### API Response
```
HTTP/2 200
cache-control: no-store
content-type: application/json; charset=utf-8
strict-transport-security: max-age=31536000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()
content-security-policy-report-only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;
```

### Static Chunk Response
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
content-type: application/javascript; charset=UTF-8
etag: W/"d6d-198f7b8a8f8"
```

## CSP Enforcement Timeline

- **Current:** Report-Only mode (monitoring)
- **Target:** Sep 6, 2025 - Flip to enforced mode
- **Action:** Change `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `next.config.mjs`

## Rollback Reference

If headers drift, rollback to tagged version:

```bash
# Get image from tag
gcloud run services update siraj --region us-central1 --image gcr.io/<proj>/<img>@<digest-from-tag>
gcloud run services update siraj-eu --region europe-west1 --image gcr.io/<proj>/<img>@<same-digest>

# Invalidate CDN
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path '/*' --quiet
```

## Tag Reference

- **Current Working State:** `v1.0.0-cdn-hardening`
- **Deployed:** ✅ Both US and EU regions
- **CDN:** ✅ Headers verified through CDN
- **Monitoring:** ✅ Scripts in place
