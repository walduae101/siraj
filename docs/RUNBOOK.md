# Siraj Bullet-Proof tRPC Runbook

## System Overview

The Siraj application uses a bullet-proof tRPC implementation deployed across two regions (US and EU) with automatic parity enforcement, Secret Manager integration, and comprehensive monitoring.

### Architecture
- **US Region**: `siraj` service in `us-central1`
- **EU Region**: `siraj-eu` service in `europe-west1`
- **CDN**: `siraj-web-map` with global distribution
- **Secrets**: All environment variables managed via Google Secret Manager
- **CI/CD**: Cloud Build with automatic parity enforcement

## Daily 30-Second Spot Check

Run these commands to verify system health:

```bash
# Set environment variables
PROJECT_ID="walduae-project-20250809071906"
US_SERVICE="siraj"
US_REGION="us-central1"
EU_SERVICE="siraj-eu"
EU_REGION="europe-west1"

# Origin probes
US=$(gcloud run services describe $US_SERVICE --region $US_REGION --format='value(status.url)')
EU=$(gcloud run services describe $EU_SERVICE --region $EU_REGION --format='value(status.url)')

curl -sSI "$US/api/health" | egrep -i '^(HTTP|cache-control|content-type|strict-transport)'
curl -sSI "$EU/api/health" | egrep -i '^(HTTP|cache-control|content-type|strict-transport)'

curl -sS  "$US/api/trpc/payments.methods?input=%7B%7D" -i | egrep -i '^(HTTP|x-trpc-handler|content-type|cache-control)'
curl -sS  "$EU/api/trpc/payments.methods?input=%7B%7D" -i | egrep -i '^(HTTP|x-trpc-handler|content-type|cache-control)'

# CDN + immutable asset
curl -sSI https://siraj.life | egrep -i '^(HTTP|cache-control|content-type|vary|strict-transport)'
ASSET=$(curl -s https://siraj.life | grep -oE '/_next/static/(chunks|app)/[^"]+\.js' | head -1)
curl -sSI "https://siraj.life$ASSET" | egrep -i '^(HTTP|cache-control|content-type|age|etag)'
```

### Expected Results
- **Health endpoints**: `HTTP/1.1 200 OK` with `cache-control: no-store`
- **tRPC endpoints**: `HTTP/1.1 200 OK` with `x-trpc-handler: router` and JSON response
- **CDN**: Security headers present, static assets with `cache-control: public, max-age=31536000, immutable`

## Troubleshooting

### EU Region Drift Recovery

If EU region starts returning HTML errors or different responses:

```bash
# 1. Check image parity
echo "US:" $(gcloud run services describe $US_SERVICE --region $US_REGION --format='value(spec.template.spec.containers[0].image)')
echo "EU:" $(gcloud run services describe $EU_SERVICE --region $EU_REGION --format='value(spec.template.spec.containers[0].image)')

# 2. Force EU to use same image as US
IMG_US=$(gcloud run services describe $US_SERVICE --region $US_REGION --format='value(spec.template.spec.containers[0].image)')
gcloud run services update $EU_SERVICE --region $EU_REGION --image "$IMG_US"

# 3. Invalidate CDN cache
gcloud compute url-maps invalidate-cdn-cache siraj-url-map --path "/*" --async

# 4. Re-run daily checks
```

### Secret Rotation (Zero Downtime)

To update environment variables:

```bash
# 1. Add new secret version
echo -n 'NEW_VALUE' | gcloud secrets versions add SECRET_NAME --data-file=-

# 2. Force new revision (optional)
gcloud run services update $EU_SERVICE --region $EU_REGION --update-labels=rollout=$(date +%s)
gcloud run services update $US_SERVICE --region $US_REGION --update-labels=rollout=$(date +%s)

# 3. Verify changes
# Re-run daily checks
```

### Environment Parity Check

Verify both regions have identical secret references:

```bash
# Function to dump environment references
dump() {
  gcloud run services describe "$1" --region "$2" --format=json \
  | jq -r '.spec.template.spec.containers[0].env[]? 
      | if has("valueFrom") and .valueFrom.secretKeyRef.name then
          "\(.name)=secret:\(.valueFrom.secretKeyRef.name)"
        else
          "\(.name)=plain"
        end' | sort
}

# Compare regions
diff <(dump "$US_SERVICE" "$US_REGION") <(dump "$EU_SERVICE" "$EU_REGION") || true
```

## CI/CD Pipeline

### Cloud Build Steps
1. **Build**: Container image with latest code
2. **Deploy US**: Deploy to US region with Secret Manager
3. **Capture Image**: Store US image digest
4. **Deploy EU**: Deploy EU to same image
5. **Environment Parity**: Verify secret references match
6. **CDN Invalidation**: Clear cache
7. **Post-Deploy Checks**: Verify origins and CDN
8. **tRPC Validation**: Run comprehensive tRPC checks

### Branch Protection
- **Main branch**: Requires all status checks to pass
- **tRPC Post-Deploy**: Must pass before merge
- **Environment Parity**: Automatic enforcement

## Security

### Content Security Policy (CSP)
- **Current**: Report-Only mode active
- **Enforcement Date**: September 6, 2025 (Asia/Dubai timezone)
- **Action Required**: Switch from `content-security-policy-report-only` to `content-security-policy`

### Secret Management
- All environment variables stored in Google Secret Manager
- Service accounts have `roles/secretmanager.secretAccessor`
- No secrets in code or build artifacts

## Monitoring

### Key Metrics
- **Response Time**: < 500ms for tRPC endpoints
- **Error Rate**: < 0.1% for API endpoints
- **Availability**: 99.9% uptime
- **Parity**: Identical responses between regions

### Alerts
- Environment parity drift
- Image version mismatch
- tRPC endpoint failures
- CDN cache issues

## Feature Flags

### Payments
- **Status**: Disabled (returns `enabled: false`)
- **Configuration**: Managed via `SIRAJ_CONFIG_JSON` secret
- **Enable**: Update secret value and redeploy

### RTL Support
- **Status**: Enabled for Arabic
- **Configuration**: Managed via `SIRAJ_CONFIG_JSON` secret

## Emergency Procedures

### Rollback
```bash
# Rollback to previous revision
gcloud run services update-traffic $US_SERVICE --region $US_REGION --to-revisions=siraj-00194-xxx=100
gcloud run services update-traffic $EU_SERVICE --region $EU_REGION --to-revisions=siraj-eu-00015-xxx=100
```

### Complete System Reset
```bash
# Force fresh deployment
gcloud run services update $US_SERVICE --region $US_REGION --update-labels=emergency-reset=$(date +%s)
gcloud run services update $EU_SERVICE --region $EU_REGION --update-labels=emergency-reset=$(date +%s)
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --async
```

## Contact Information

- **Primary Contact**: Development Team
- **Escalation**: Senior Dev Lead
- **Emergency**: Cloud Run Console + Logs

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Production Ready ✅
