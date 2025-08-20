# Migration Guide: Environment Variables to Google Secret Manager

This guide explains how to migrate from environment variables to Google Secret Manager for the Siraj application.

## Overview

We've centralized all configuration in Google Secret Manager, which provides:
- Centralized management
- Hot reloading without redeploys
- Better security
- Audit trails

## What Changed

### 1. New Config Loader (`src/server/config.ts`)
- Reads configuration from `/var/secrets/siraj/config.json`
- TTL cache (60 seconds) for performance
- Falls back to env vars in development
- Fully typed with Zod validation

### 2. Updated Code
All server-side code now uses `getConfig()` instead of `process.env`:

```typescript
// Before
const productId = process.env.PAYNOW_PRODUCTS_JSON[sku];

// After
import { getConfig } from "~/server/config";
const cfg = getConfig();
const productId = cfg.paynow.products[sku];
```

### 3. Files Updated
- `src/server/api/routers/checkout.ts` - Uses config for product mapping
- `src/server/services/paynowMgmt.ts` - Uses config for API keys
- `src/server/services/subscriptions.ts` - Uses config for plan points
- `src/app/api/paynow/webhook/route.ts` - Uses config for webhook secret
- `src/app/api/cron/subscription-credit/route.ts` - Uses config for cron secret
- `src/server/services/points.ts` - Uses config for lazy topup flag

## Migration Steps

### 1. Create Secrets in Google Secret Manager

```bash
# Navigate to the project root
cd /path/to/siraj

# Create the main config secret
gcloud secrets create siraj-config \
  --project=walduae-project-20250809071906 \
  --replication-policy="automatic" \
  --data-file="secrets/siraj-config.json"

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding siraj-config \
  --project=walduae-project-20250809071906 \
  --role="roles/secretmanager.secretAccessor" \
  --member="serviceAccount:207501673877-compute@developer.gserviceaccount.com"
```

### 2. Deploy with Secret Mounting

Option A: Using Cloud Console
1. Go to Cloud Run → siraj service
2. Click "Edit & Deploy New Revision"
3. Go to "Container, Variables & Secrets, Connections, Security"
4. Under "Variables & Secrets" → "Secret Manager"
5. Mount `siraj-config` as volume:
   - Secret: `siraj-config`
   - Reference method: Mounted as volume
   - Mount path: `/var/secrets/siraj/config.json`
   - Version: `latest`

Option B: Using gcloud CLI
```bash
gcloud run services update siraj \
  --region=us-central1 \
  --update-secrets=/var/secrets/siraj/config.json=siraj-config:latest \
  --set-env-vars=SIRAJ_CONFIG_PATH=/var/secrets/siraj/config.json
```

### 3. Remove Old Environment Variables

After confirming the deployment works:
1. Remove sensitive env vars from `cloudrun.env.yaml`
2. Keep only public `NEXT_PUBLIC_*` variables
3. Keep `NODE_ENV`, `SIRAJ_CONFIG_PATH`

## Testing

### 1. Local Development
For local development, set `SIRAJ_CONFIG_PATH` to point to your local config:
```bash
export SIRAJ_CONFIG_PATH=./secrets/siraj-config.json
pnpm dev
```

### 2. Production Testing
After deployment:
```bash
# Test checkout endpoint
curl https://siraj.life/api/trpc/points.getWallet?input={}

# Test a purchase flow
# 1. Go to https://siraj.life/paywall
# 2. Click any "شراء" button
# 3. Complete purchase
# 4. Verify points credited
```

### 3. Hot Reload Testing
1. Update a product mapping in Secret Manager:
   ```bash
   # Download current version
   gcloud secrets versions access latest --secret=siraj-config > config.json
   
   # Edit config.json (add new product, change points, etc)
   
   # Create new version
   gcloud secrets versions add siraj-config --data-file=config.json
   ```

2. Wait ~1 minute for TTL to expire
3. Test the change without redeploying!

## Rollback Plan

If issues arise:
1. Revert to the previous Cloud Run revision
2. Or temporarily add env vars back while debugging:
   ```bash
   gcloud run services update siraj \
     --set-env-vars=PAYNOW_API_KEY=xxx,PAYNOW_WEBHOOK_SECRET=yyy
   ```

## Security Notes

1. **Never commit** `secrets/` directory
2. `.gitignore` has been updated to exclude secrets
3. Only the Cloud Run service account needs access
4. Use Secret Manager audit logs to track access

## Benefits Achieved

✅ Centralized configuration management
✅ No more env var sync issues
✅ Hot reload for non-sensitive config changes
✅ Better security with IAM controls
✅ Audit trail for all config access
✅ Easier rotation of secrets
