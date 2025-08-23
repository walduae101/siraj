# Production Deployment Guide - Fix 500 Errors

## Problem Summary

The production website (https://siraj.life) is experiencing 500 errors on API endpoints because:
1. The configuration file is missing the required `rateLimit` section
2. The code expects this configuration but it's not provided

## Solution Steps

### Step 1: Update Configuration

The production configuration needs to include the `rateLimit` section. Use the provided `config.production.json` as a template.

### Step 2: Deploy Configuration to Google Cloud

#### Option A: Using Secret Manager (Recommended)

1. First, create the secret if it doesn't exist:
```bash
gcloud secrets create siraj-config --data-file=config.production.json
```

2. Or update existing secret:
```bash
gcloud secrets versions add siraj-config --data-file=config.production.json
```

3. Grant Cloud Run access to the secret:
```bash
gcloud secrets add-iam-policy-binding siraj-config \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@YOUR-PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### Option B: Using Environment Variables (Quick Fix)

1. Set environment variables to disable rate limiting temporarily:
```bash
gcloud run services update siraj \
  --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false"
```

2. Or deploy with full configuration:
```bash
# Convert config to JSON string
CONFIG_JSON=$(cat config.production.json | jq -c .)

# Update Cloud Run service
gcloud run services update siraj \
  --update-env-vars="SIRAJ_CONFIG=$CONFIG_JSON"
```

### Step 3: Verify Deployment

1. Check service status:
```bash
gcloud run services describe siraj --region=YOUR-REGION
```

2. Test the API endpoints:
```bash
# Test wallet endpoint
curl -H "Authorization: Bearer [YOUR-ACTUAL-TOKEN]" \
  https://siraj.life/api/trpc/points.getWallet?input=%7B%22json%22%3A%7B%22uid%22%3A%22test%22%7D%7D

# Test checkout endpoint
curl -X POST https://siraj.life/api/trpc/checkout.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR-ACTUAL-TOKEN]" \
  -d '{"json":{"productId":"premium_100","redirectUrl":"/dashboard"}}'
```

### Step 4: Monitor Logs

Check Cloud Run logs for any remaining errors:
```bash
gcloud run services logs read siraj --limit=50
```

## Environment Variables Required

Make sure these are set in your Cloud Run service:

```env
# Required public variables
NEXT_PUBLIC_BACKGROUND_IMAGE_URL=https://your-cdn.com/background.jpg
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite
NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE=Connect to server

# Feature flags (if not in config file)
RATE_LIMIT_ENABLED=true
RISK_HOLDS_ENABLED=true
PRODUCT_SOT=firestore
RECONCILIATION_ENABLED=true
BACKFILL_ENABLED=true
```

## Rollback Plan

If issues persist after deployment:

1. Disable rate limiting:
```bash
gcloud run services update siraj \
  --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false"
```

2. Roll back to previous revision:
```bash
gcloud run services update-traffic siraj --to-revisions=PREVIOUS-REVISION=100
```

## Configuration File Structure

The complete configuration should include all these sections:
- `paynow` - Payment provider settings
- `subscriptions` - Subscription plans and settings
- `auth` - Authentication configuration
- `firebase` - Firebase project settings
- `features` - Feature flags
- `rateLimit` - Rate limiting configuration (NEW)

See `config.production.json` for the complete structure.
