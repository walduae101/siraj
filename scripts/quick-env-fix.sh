#!/bin/bash

# Quick environment variable fix for production
# This sets all required environment variables directly

echo "🚀 Applying quick environment variable fix..."

# Apply all required environment variables
gcloud run services update siraj \
  --region=us-central1 \
  --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false,PRODUCT_SOT=firestore,RECONCILIATION_ENABLED=true,BACKFILL_ENABLED=true,ALLOW_NEGATIVE_BALANCE=false,WEBHOOK_MODE=sync,ENVIRONMENT=prod" \
  --update-env-vars="RATELIMIT_AUTHENTICATED_RPM=30,RATELIMIT_AUTHENTICATED_BURST=15,RATELIMIT_ANONYMOUS_RPM=10,RATELIMIT_ANONYMOUS_BURST=5,RATELIMIT_ADMIN_RPM=3,RATELIMIT_ADMIN_BURST=1" \
  --update-env-vars="RATELIMIT_WEBHOOK_RPM=300,RATELIMIT_WEBHOOK_BURST=100,RATELIMIT_PAYWALL_RPM=60,RATELIMIT_PAYWALL_BURST=30,RATELIMIT_PROMO_RPM=10,RATELIMIT_PROMO_BURST=5"

echo "✅ Environment variables updated"
echo ""
echo "The service will redeploy automatically. This may take 1-2 minutes."
echo "Rate limiting is DISABLED to ensure immediate functionality."
echo ""
echo "To re-enable rate limiting later, run:"
echo "gcloud run services update siraj --region=us-central1 --update-env-vars=\"RATE_LIMIT_ENABLED=true\""
