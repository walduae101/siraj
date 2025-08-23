# Production Configuration Update - Phase 5

## Issue

The production deployment is experiencing 500 errors on API endpoints because the configuration file is missing the new `rateLimit` section that was added in Phase 5.

## Error Details

1. **API Endpoint Errors**:
   - `/api/trpc/points.getWallet` - 500 Internal Server Error
   - `/api/trpc/checkout.create` - 500 Internal Server Error with message: `"rateLimit" is required`

2. **Root Cause**:
   - The production configuration file (either in Secret Manager or `/var/secrets/siraj/config.json`) is missing the `rateLimit` configuration section
   - This section was added in Phase 5 for fraud/abuse controls

## Solution

### Option 1: Update Secret Manager Configuration

If using Google Secret Manager, update the `siraj-config` secret with the complete configuration including the new `rateLimit` section:

```json
{
  "paynow": {
    // ... existing paynow config ...
  },
  "subscriptions": {
    // ... existing subscriptions config ...
  },
  "auth": {
    // ... existing auth config ...
  },
  "firebase": {
    // ... existing firebase config ...
  },
  "openai": {
    // ... existing openai config ...
  },
  "features": {
    // ... existing features config ...
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

### Option 2: Update Environment Variables

If using environment variables, ensure these are set in Cloud Run:

```bash
# Rate Limiting - Default Limits
RATE_LIMIT_AUTH_RPM=30
RATE_LIMIT_AUTH_BURST=15
RATE_LIMIT_ANON_RPM=10
RATE_LIMIT_ANON_BURST=5
RATE_LIMIT_ADMIN_RPM=3
RATE_LIMIT_ADMIN_BURST=1

# Rate Limiting - Route-specific
RATE_LIMIT_WEBHOOK_RPM=300
RATE_LIMIT_WEBHOOK_BURST=100
RATE_LIMIT_PAYWALL_RPM=60
RATE_LIMIT_PAYWALL_BURST=30
RATE_LIMIT_PROMO_RPM=10
RATE_LIMIT_PROMO_BURST=5
RATE_LIMIT_ADMIN_ROUTE_RPM=3
RATE_LIMIT_ADMIN_ROUTE_BURST=1

# Feature Flags
RATE_LIMIT_ENABLED=1
RISK_HOLDS_ENABLED=1
```

## Verification Steps

1. **Run the verification script locally**:
   ```bash
   npx tsx scripts/verify-production-config.ts
   ```

2. **Check Cloud Run logs** for configuration loading errors:
   ```bash
   gcloud run services logs read siraj --limit=50
   ```

3. **Test the API endpoints** after configuration update:
   - Visit https://siraj.life/paywall
   - Check browser console for API errors
   - Verify wallet loading and checkout functionality

## Quick Fix

If you need a quick fix to disable rate limiting temporarily:

1. Set `RATE_LIMIT_ENABLED=0` in environment variables
2. Redeploy the Cloud Run service
3. This will bypass rate limiting checks until proper configuration is in place

## Prevention

1. **Configuration Validation**: The application now validates configuration on startup
2. **Deployment Checklist**: Always verify configuration changes when adding new features
3. **Monitoring**: Set up alerts for 500 errors on critical API endpoints

## Related Files

- `src/server/config.ts` - Configuration schema and loading logic
- `scripts/verify-production-config.ts` - Configuration verification script
- `docs/PHASE_5/README.md` - Phase 5 implementation details
