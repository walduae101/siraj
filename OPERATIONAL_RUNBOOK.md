# Siraj Operational Runbook

## Quick Daily Spot-Check (One-liners)

```bash
# HTML via CDN: must be no-store + security headers + Vary: Accept
curl -sSI https://siraj.life | egrep -i '^(HTTP|cache-control|content-type|vary|strict-transport|x-content-type-options|x-frame-options|referrer-policy|permissions-policy|content-security-policy)'

# API via CDN (HEAD + GET)
curl -sSI https://siraj.life/api/health | egrep -i '^(HTTP|cache-control|content-type)'
curl -sS  https://siraj.life/api/health | head -c 200; echo

# One real chunk (immutable)
ASSET=$(curl -s https://siraj.life | grep -oE '/_next/static/(chunks|app)/[^"]+\.js' | head -1)
curl -sSI "https://siraj.life$ASSET" | egrep -i '^(HTTP|cache-control|content-type|age|etag)'
```

## Troubleshooting: CDN Header Issues

**Symptom:** CDN serves HTML without security headers or chunks with `no-store`

### Fix Sequence:

1. **Check multi-region parity**
   ```bash
   ./scripts/verify-origins.sh || true
   ```
   
   * If mismatched → update EU to US image:
   ```bash
   IMAGE="$(gcloud run services describe siraj --region=us-central1 \
     --format='value(spec.template.spec.containers[0].image)')"
   gcloud run services update siraj-eu --region=europe-west1 --image "$IMAGE" --quiet
   ```

2. **Purge CDN**
   ```bash
   gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --quiet
   ```

3. **Re-verify**
   ```bash
   ./scripts/cdn-parity.sh
   ```

## Monitoring & Alerts

### Header Drift Detection
- **Frequency:** Every 15 minutes (Abu Dhabi local time)
- **Script:** `./scripts/cdn-parity.sh`
- **Alert:** 2 consecutive failures

### Origin Image Drift Detection
- **Frequency:** Every 15 minutes
- **Script:** `./scripts/verify-origins.sh`
- **Alert:** If images differ between US and EU

### SLOs
- **p95 HTML TTFB:** < 800 ms (CDN)
- **5xx rate:** < 1% (5m window)
- **CDN hit ratio:** > 80% for `/_next/static/*`

## Cloud Armor Setup (When Quota Available)

```bash
# Create a minimal allowlist-baseline policy with preconfigured protections
gcloud compute security-policies create siraj-waf --description="Baseline WAF"
gcloud compute security-policies update siraj-waf \
  --enable-layer7-ddos-defense \
  --log-level=VERBOSE

# Add a rule to block obvious bad bots (optional, start as preview)
gcloud compute security-policies rules create 1000 \
  --security-policy=siraj-waf \
  --expression="request.headers['user-agent'].matches('(?i)sqlmap|acunetix|nikto')" \
  --action=deny-403 --preview

# Attach to your backend service
gcloud compute backend-services update siraj-web-backend --global \
  --security-policy siraj-waf
```

**Playbook:** Run in **preview** for 48–72 hours, watch logs for false positives, then flip out of preview.

## CSP Enforcement (When Ready)

After ~7 days of clean reports from `/api/csp-report`:

1. Change the header key from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `next.config.mjs`
2. Keep `report-to`/`report-uri` for monitoring after enforcement
3. Deploy and monitor for any violations

## Expected Header Behavior

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

## Security Headers Reference

The application serves these security headers on HTML and API responses:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()`
- `Content-Security-Policy-Report-Only: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; report-uri /api/csp-report;`

## Emergency Contacts

- **Primary:** DevOps Team
- **Secondary:** Security Team
- **Escalation:** CTO

## Status Dashboard

- **Production URL:** https://siraj.life
- **US Origin:** https://siraj-btmgk7htca-uc.a.run.app
- **EU Origin:** https://siraj-eu-btmgk7htca-ew.a.run.app
- **CDN:** Google Cloud CDN
- **Load Balancer:** siraj-web-map
