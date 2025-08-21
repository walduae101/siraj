# PayNow Webhook Implementation - Complete

## Summary

✅ **CRITICAL BUG FIXED**: The original webhook had an undefined `mac` variable that broke all HMAC verification.

✅ **COMPREHENSIVE WEBHOOK SYSTEM**: Implemented full security, idempotency, and event handling as specified in the plan.

## What Was Implemented

### 1. 🔒 Security Features
- **HMAC Verification**: Fixed and properly implemented using PayNow's exact signature format
- **Replay Protection**: Events older than 5 minutes are rejected using PayNow timestamp headers  
- **Idempotency**: Each webhook event is processed exactly once using `webhookEvents` collection
- **Fast ACK**: Returns 200 immediately, then processes (prevents PayNow timeouts)

### 2. 📊 Event Handling  
Now handles all recommended PayNow events:
- `ON_ORDER_COMPLETED` - One-time point purchases
- `ON_DELIVERY_ITEM_ADDED` - Alternative to order completion 
- `ON_SUBSCRIPTION_ACTIVATED` - New subscription setup + first credit
- `ON_SUBSCRIPTION_RENEWED` - Monthly subscription credits
- `ON_SUBSCRIPTION_CANCELED` / `ON_SUBSCRIPTION_EXPIRED` - Subscription termination

### 3. 🗃️ Firestore Schema
Added missing collections and ensured proper document structure:
- `webhookEvents/{eventId}` - Event tracking for idempotency
- `paynowCustomers/{customerId}` - PayNow customer → Firebase user mapping
- `users/{uid}/ledger/{txId}` - Enhanced with proper event tracking
- **User Document Creation**: All services now ensure `users/{uid}` exists before operations

### 4. 🔗 User Mapping Strategy
Three-tier fallback system:
1. **Primary**: Customer metadata `uid` field  
2. **Secondary**: PayNow customer ID lookup in `paynowCustomers` collection
3. **Tertiary**: Email-based lookup in `userMappings` with retroactive mapping creation

### 5. 📋 Configuration Migration
- **Product Mapping**: Migrated from `process.env` to Secret Manager via `getConfig()`
- **All Secrets**: Webhook secret, API keys, product mappings now use centralized config
- **Backward Compatibility**: Development mode falls back to environment variables

## Files Modified

### Core Implementation
- `src/app/api/paynow/webhook/route.ts` - **Complete rewrite** with all security features
- `src/server/services/points.ts` - Added user document creation, improved error handling
- `src/server/services/paynowMgmt.ts` - Updated customer mapping to use proper collections

### Schema & Rules  
- `firestore.rules` - Added rules for new collections (`webhookEvents`, `paynowCustomers`, `users`)
- `firestore.indexes.json` - **NEW** - Added required composite indexes for subscription queries

### Testing
- `tools/test-paynow-webhook.ts` - **NEW** - Comprehensive webhook test suite

## Testing Instructions

### 1. Local Testing

```bash
# Start development server
pnpm dev

# In another terminal, run webhook tests
npx tsx tools/test-paynow-webhook.ts

# Test specific scenarios:
WEBHOOK_URL=http://localhost:3000/api/paynow/webhook \
PAYNOW_WEBHOOK_SECRET=your-test-secret \
npx tsx tools/test-paynow-webhook.ts
```

### 2. Production Smoke Tests

After deployment, perform these tests:

```bash
# Test webhook endpoint accessibility
curl -X POST https://siraj.life/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "PayNow-Signature: invalid" \
  -H "PayNow-Timestamp: $(date +%s)" \
  -d '{"test": "data"}'
# Should return 401 Invalid signature

# Test points wallet endpoint  
curl "https://siraj.life/api/trpc/points.getWallet?input={}" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
# Should return wallet data for authenticated user
```

### 3. End-to-End Purchase Flow

1. **Setup Test Products** in PayNow dashboard:
   - Create test point packages (e.g., 100 points, 500 points)
   - Map product IDs in Secret Manager config: `paynow.products`

2. **Configure Webhook** in PayNow dashboard:
   - URL: `https://siraj.life/api/paynow/webhook`
   - Events: Enable all subscription and order events
   - Secret: Match your `PAYNOW_WEBHOOK_SECRET` in Secret Manager

3. **Test Purchase**:
   - Sign in to your app
   - Go to paywall/purchase page
   - Buy a test points package  
   - Verify points are credited in your wallet
   - Check Firestore for proper ledger entries

4. **Test Subscription**:
   - Purchase a subscription
   - Verify first month credits immediately  
   - Wait for renewal webhook (or trigger manually)
   - Verify monthly credits work

## Security Validation

### ✅ HMAC Verification
- Uses correct PayNow signature format: `timestamp.payload`
- Properly compares hex-encoded signatures with `crypto.timingSafeEqual`
- Rejects requests with missing or invalid signatures

### ✅ Replay Protection  
- Validates PayNow timestamp headers
- Rejects events older than 5 minutes
- Prevents replay attacks

### ✅ Idempotency
- Each `event_id` processed exactly once
- Duplicate events return 200 but skip processing
- Audit trail in `webhookEvents` collection

### ✅ User Security
- All operations require valid user mapping
- Firebase users documents created before wallet operations  
- Server-only writes (client cannot directly credit points)

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert to previous Cloud Run revision
2. **Webhook Issues**: Update PayNow dashboard to pause webhook events
3. **Data Issues**: All operations are idempotent and can be safely re-run
4. **Secret Issues**: Emergency fallback to env vars in config.ts (development mode)

## Monitoring & Alerts

Add these to your monitoring:
- **Webhook 4xx/5xx rates** - Authentication/processing failures
- **Webhook processing time** - Should be < 5 seconds for fast ACK
- **Failed user mappings** - Payments not credited due to missing user links
- **Duplicate event rates** - Should be low (idempotency working)

## Next Steps

1. **Deploy** the updated webhook system
2. **Update PayNow webhook settings** to point to your production URL
3. **Configure Secret Manager** with your production PayNow credentials  
4. **Test** with small real purchases
5. **Monitor** webhook success rates and point crediting
6. **Scale** by adding background job processing if webhook times exceed 5 seconds

## Key Benefits Achieved

🎯 **Reliability**: Idempotent processing prevents double-crediting  
🔒 **Security**: Proper HMAC verification and replay protection  
📈 **Scalability**: Fast webhook ACK prevents PayNow timeouts  
🧪 **Testability**: Comprehensive test suite for all scenarios  
📊 **Auditability**: Complete event tracking in Firestore  
🔄 **Flexibility**: Handles all PayNow event types for future expansion

The webhook system is now production-ready and follows all PayNow best practices! 🚀
