# 🚨 FIX PRODUCTION 500 ERRORS - IMMEDIATE ACTION REQUIRED

## Current Issue
- **Website**: https://siraj.life
- **Problem**: API endpoints returning 500 errors
- **Error**: "rateLimit" is required but received undefined
- **Impact**: Users cannot access wallet or checkout functionality

## FASTEST FIX (Do This First) - 2 Minutes

Run this command to disable rate limiting temporarily:

```bash
gcloud run services update siraj \
  --region=us-central1 \
  --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false"
```

This will fix the errors immediately while you work on the permanent solution.

## PERMANENT FIX - 10 Minutes

### Option 1: Using the Deployment Script (Recommended)

We've created scripts to automate the fix:

**On Windows (PowerShell):**
```powershell
.\scripts\deploy-production-fix.ps1
```

**On Mac/Linux:**
```bash
chmod +x scripts/deploy-production-fix.sh
./scripts/deploy-production-fix.sh
```

Choose option 3 (Both) when prompted for the most thorough fix.

### Option 2: Manual Steps

1. **Update Secret Manager** with the complete configuration:
   ```bash
   gcloud secrets versions add siraj-config --data-file=config.production.json
   ```

2. **Update environment variables**:
   ```bash
   gcloud run services update siraj \
     --region=us-central1 \
     --update-env-vars="RATE_LIMIT_ENABLED=true,RISK_HOLDS_ENABLED=true,PRODUCT_SOT=firestore"
   ```

3. **Restart the service**:
   ```bash
   gcloud run services update siraj --region=us-central1 --no-traffic
   gcloud run services update-traffic siraj --to-latest --region=us-central1
   ```

## Validate the Fix

Run the validation script:
```bash
npx tsx scripts/validate-production.ts
```

Or manually check:
1. Visit https://siraj.life
2. Open browser console (F12)
3. Look for any 500 errors
4. Try to log in

## If Still Not Working

1. **Check logs**:
   ```bash
   gcloud run services logs read siraj --limit=100 | grep -i error
   ```

2. **Check configuration**:
   ```bash
   gcloud run services describe siraj --region=us-central1 --format=json | jq '.spec.template.spec.containers[0].env'
   ```

3. **Emergency rollback**:
   ```bash
   # Get previous revision
   gcloud run revisions list --service=siraj --region=us-central1
   
   # Route traffic to previous working revision
   gcloud run services update-traffic siraj \
     --to-revisions=PREVIOUS_REVISION_NAME=100 \
     --region=us-central1
   ```

## Configuration Structure Required

The production needs this in either Secret Manager or environment variables:

```json
{
  "paynow": { /* payment config */ },
  "subscriptions": { /* subscription config */ },
  "auth": { /* auth config */ },
  "firebase": { /* firebase config */ },
  "features": {
    "RATE_LIMIT_ENABLED": true,
    "RISK_HOLDS_ENABLED": true
  },
  "rateLimit": {
    "authenticated": {
      "requestsPerMinute": 30,
      "burstSize": 15
    },
    "anonymous": {
      "requestsPerMinute": 10,
      "burstSize": 5
    },
    "admin": {
      "requestsPerMinute": 3,
      "burstSize": 1
    },
    "routes": {
      "webhook": {
        "requestsPerMinute": 300,
        "burstSize": 100
      },
      "paywall": {
        "requestsPerMinute": 60,
        "burstSize": 30
      },
      "promo": {
        "requestsPerMinute": 10,
        "burstSize": 5
      },
      "admin": {
        "requestsPerMinute": 3,
        "burstSize": 1
      }
    }
  }
}
```

## Support

If you need help:
1. Check `docs/PHASE_5/PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review the error logs in Cloud Console
3. The issue is specifically the missing `rateLimit` configuration section

## Success Criteria

✅ No more 500 errors in browser console
✅ Wallet API loads without errors
✅ Checkout process works
✅ Users can log in successfully
