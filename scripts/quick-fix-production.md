# Quick Fix for Production 500 Errors

## Immediate Solution (Temporary)

If you need to quickly fix the production errors, you can temporarily disable rate limiting by setting these environment variables:

```bash
# In your Cloud Run service or deployment:
RATE_LIMIT_ENABLED=false
RISK_HOLDS_ENABLED=false
```

This will bypass the rate limiting checks that are causing the 500 errors.

## Permanent Solution

1. **Update your production configuration** with the complete config including rateLimit:
   ```bash
   # Run the fix script to generate the proper configuration
   npx tsx scripts/fix-production-config.ts config.production.json
   ```

2. **Update Secret Manager** (if using Google Secret Manager):
   ```bash
   # Update the secret with the fixed configuration
   gcloud secrets versions add siraj-config --data-file=config.production.fixed.json
   ```

3. **Or update environment variables** directly in Cloud Run:
   ```bash
   # Set the complete configuration as an environment variable
   gcloud run services update siraj-prod \
     --update-env-vars="SIRAJ_CONFIG=$(cat config.production.fixed.json | jq -c .)"
   ```

## Verification

After applying the fix, test the endpoints:

1. Check wallet endpoint:
   ```bash
   curl https://siraj.life/api/trpc/points.getWallet?input=%7B%22json%22%3A%7B%22uid%22%3A%22test%22%7D%7D
   ```

2. Check checkout endpoint:
   ```bash
   curl -X POST https://siraj.life/api/trpc/checkout.create \
     -H "Content-Type: application/json" \
     -d '{"json":{"productId":"premium_100","redirectUrl":"/dashboard"}}'
   ```

Both should return proper responses instead of 500 errors.
