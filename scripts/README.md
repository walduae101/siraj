# Siraj Deployment & Verification Scripts

This directory contains scripts to ensure bullet-proof security headers and caching across the CDN.

## Scripts Overview

### 🔍 Verification Scripts

- **`verify-origins.sh`** - Ensures US and EU regions return identical headers
- **`cdn-parity.sh`** - Verifies CDN serves expected headers for HTML/API/static assets
- **`validate-config.sh`** - Validates `next.config.mjs` has correct header configuration
- **`quick-check.sh`** - Quick monitoring script for header verification

### 🚀 Deployment Scripts

- **`deploy-both-regions.sh`** - Deploys same image to both regions and purges CDN

## Usage

### Manual Verification
```bash
# Check origin parity (US vs EU)
./scripts/verify-origins.sh

# Check CDN header serving
./scripts/cdn-parity.sh

# Quick monitoring check
./scripts/quick-check.sh
```

### Deployment
```bash
# Deploy to both regions with same image
./scripts/deploy-both-regions.sh
```

### CI Integration
Add to your Cloud Build pipeline:
```yaml
steps:
  # ... build step ...
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: Deploy both regions
    entrypoint: bash
    args:
      - -lc
      - |
        set -euo pipefail
        IMAGE="$IMAGE"
        echo "Deploying $IMAGE to US and EU"
        gcloud run services update siraj     --region=us-central1  --image "$IMAGE" --quiet
        gcloud run services update siraj-eu  --region=europe-west1 --image "$IMAGE" --quiet
        gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --quiet

  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    id: Verify CDN + Origins
    entrypoint: bash
    args: [ "-lc", "./scripts/verify-origins.sh && ./scripts/cdn-parity.sh" ]
```

## Expected Results

### HTML Pages
- `Cache-Control: no-store`
- `Content-Type: text/html; charset=utf-8`
- All security headers present
- `Vary: Accept`

### API Routes
- `Cache-Control: no-store`
- `Content-Type: application/json; charset=utf-8`
- All security headers present

### Static Assets
- `Cache-Control: public, max-age=31536000, immutable`
- `Content-Type: application/javascript; charset=UTF-8`
- **No security headers** (assets remain clean)

## Troubleshooting

If verification fails:

1. **Check region parity**: Run `./scripts/verify-origins.sh`
2. **Update EU region**: `gcloud run services update siraj-eu --region=europe-west1 --image "$IMAGE"`
3. **Purge CDN**: `gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*"`
4. **Re-verify**: Run `./scripts/cdn-parity.sh`

## Security Headers

The application serves these security headers on HTML and API responses:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()`
- `Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;`
