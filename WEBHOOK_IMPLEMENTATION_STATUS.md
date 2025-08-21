# PayNow Webhook Implementation Status Report

**Date:** December 21, 2024  
**Status:** ✅ READY FOR TESTING

## Summary

All technical implementation tasks from your plan have been completed. The webhook is deployed and ready to receive PayNow events.

## What Was Fixed

### 1. ✅ Webhook Signature Verification
- **Issue:** Using hex encoding instead of base64
- **Fix:** Updated to use base64 encoding per PayNow spec
- **Status:** Deployed to Cloud Run

### 2. ✅ Header Names
- **Issue:** Using capitalized headers (PayNow-Signature)
- **Fix:** Changed to lowercase (paynow-signature, paynow-timestamp)
- **Status:** Deployed

### 3. ✅ Timestamp Format
- **Issue:** Multiplying timestamp by 1000 (assuming seconds)
- **Fix:** PayNow sends milliseconds, removed multiplication
- **Status:** Deployed

### 4. ✅ Event Structure
- **Issue:** Looking for `event` field
- **Fix:** Added support for `event_type` field per PayNow docs
- **Status:** Deployed

## Implementation Checklist

✅ **Fast Diagnosis**
- Cloud Run logs show webhook hits (all 401 before fix)
- tRPC procedures verified in root router

✅ **Webhook Route Alignment**
- Base64 HMAC-SHA256 verification
- Lowercase headers: paynow-timestamp, paynow-signature
- 5-minute replay protection
- Fast ACK with 200 response
- Idempotency via webhookEvents collection

✅ **Google Secret Manager**
- Secrets already configured and mounted
- Contains: apiKey, webhookSecret, storeId, products mapping

✅ **Firestore Schema**
- User documents created before wallet operations
- All collections defined with proper structure
- Composite index for subscriptions deployed
- Security rules updated

✅ **Product → Points Logic**
- ON_ORDER_COMPLETED handler implemented
- ON_SUBSCRIPTION_ACTIVATED/RENEWED handlers implemented
- Product mapping via Secret Manager config

✅ **Async Processing**
- Inline processing after 200 response
- Idempotency check prevents duplicate processing

✅ **Wallet UI**
- tRPC routes confirmed exposed in root router
- points.getWallet and checkout.create available

✅ **Observability**
- Comprehensive logging added
- Log-based metrics created:
  - paynow_webhook_requests
  - paynow_webhook_failures
- Monitoring queries documented

✅ **Documentation**
- ADR created with full architectural decisions
- Test suite implemented
- Monitoring guide created

## Next Steps - End-to-End Testing

### 1. Verify PayNow Dashboard Configuration

Check that the webhook is configured with:
- **URL:** `https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook`
- **Events:** All events enabled (or at minimum: order.completed, subscription.*)
- **Secret:** Must match the value in Google Secret Manager

### 2. Wait for Retry or Make Test Purchase

Since previous webhooks were failing with 401:
- PayNow should retry failed webhooks within 10-15 minutes
- OR make a small test purchase to trigger a new webhook

### 3. Monitor Results

Check these locations for success:

**Cloud Logging:**
```bash
gcloud logging read 'resource.labels.service_name="siraj" AND httpRequest.requestUrl:"/api/paynow/webhook" AND timestamp>="2024-12-21T14:30:00Z"' --limit=10 --format="table(timestamp, httpRequest.status, jsonPayload.message)" --project=walduae-project-20250809071906
```

**Firestore Collections:**
- `webhookEvents/{eventId}` - Should see new documents with status "processed"
- `users/{uid}/ledger/{entryId}` - Should see credit entries
- `users/{uid}/wallet/points` - Should see updated balances

### 4. Run Test Suite

```bash
cd tools
node test-paynow-webhook.ts
```

This will test:
- Valid signature acceptance
- Invalid signature rejection  
- Replay protection
- Idempotency

## Troubleshooting

### If Still Getting 401 Errors

1. **Verify webhook secret matches:**
   ```bash
   # Check secret in GSM
   gcloud secrets versions access latest --secret="siraj-config" --project=walduae-project-20250809071906 | ConvertFrom-Json | Select -ExpandProperty paynow | Select -ExpandProperty webhookSecret
   ```

2. **Check PayNow is sending correct headers:**
   - Should be lowercase: `paynow-signature`, `paynow-timestamp`
   - Signature should be base64 encoded

3. **Enable debug logging:**
   - The webhook logs received headers and signature details
   - Check Cloud Logging for detailed error messages

### If Credits Not Appearing

1. **Check user mapping:**
   - Verify `paynowCustomers` collection has mapping
   - Check if customer has `metadata.uid` field

2. **Check product mapping:**
   - Verify product IDs in webhook match configured products
   - Check Secret Manager for product mapping

3. **Check idempotency:**
   - Look for existing `webhookEvents/{eventId}` documents
   - Status "skipped" means duplicate event

## Success Criteria

You'll know the implementation is working when:
1. Webhook returns 200 status in PayNow dashboard
2. `webhookEvents` collection shows new "processed" documents
3. User wallet balance increases after purchase
4. No duplicate credits for same event

## Contact for Issues

If issues persist after following this guide:
1. Check Cloud Run logs for detailed error messages
2. Verify all secrets in Google Secret Manager
3. Ensure PayNow dashboard webhook configuration is correct

The implementation is complete and deployed. The system is now waiting for valid webhook events from PayNow.
