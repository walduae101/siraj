# 🧪 **Webhook Smoke Test Results**

## Test Configuration
- **Webhook URL**: `https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook`
- **Secret**: `pn-7cade0c6397c40da9b16f79ab5df132c`
- **Test User UID**: `OPvJByA50jQmxGrgsqmrn794Axd2`

## Test Scenarios

| Scenario | Expected Status | Expected Processing | Expected Idempotent | Expected Success |
|----------|----------------|-------------------|-------------------|-----------------|
| Valid Purchase | 200 | <250ms | No | ✅ |
| Duplicate Event | 200 | <50ms | Yes | ✅ |
| Bad Signature | 401 | <50ms | No | ❌ |
| Stale Timestamp | 401 | <50ms | No | ❌ |
| Missing Headers | 401 | <50ms | No | ❌ |

## Manual Test Command

Since Node.js output isn't appearing in PowerShell, please run these manual tests:

### Test 1: Valid Purchase
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: $(echo -n "$(date +%s)000.{\"id\":\"test-$(date +%s)\",\"event_type\":\"ON_ORDER_COMPLETED\",\"data\":{\"order\":{\"id\":\"order-123\",\"customer\":{\"id\":\"cust-456\",\"email\":\"testuser123@test.com\",\"metadata\":{\"uid\":\"OPvJByA50jQmxGrgsqmrn794Axd2\"}},\"lines\":[{\"product_id\":\"prod_QQfmFQiRyeLPBZ\",\"quantity\":1}]}}}" | openssl dgst -sha256 -hmac "pn-7cade0c6397c40da9b16f79ab5df132c" -binary | base64)" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{
    "id": "test-'$(date +%s)'",
    "event_type": "ON_ORDER_COMPLETED",
    "data": {
      "order": {
        "id": "order-123",
        "customer": {
          "id": "cust-456",
          "email": "testuser123@test.com",
          "metadata": {"uid": "OPvJByA50jQmxGrgsqmrn794Axd2"}
        },
        "lines": [{
          "product_id": "prod_QQfmFQiRyeLPBZ",
          "quantity": 1
        }]
      }
    }
  }'
```

### Test 2: Duplicate (same event ID)
Run the same command again with the same `id` field.

### Test 3: Bad Signature
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: invalid_signature" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{"id": "test-bad-sig", "event_type": "ON_ORDER_COMPLETED"}'
```

### Test 4: Stale Timestamp
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: $(echo -n "1640995200000.{\"id\":\"test-stale\"}" | openssl dgst -sha256 -hmac "pn-7cade0c6397c40da9b16f79ab5df132c" -binary | base64)" \
  -H "paynow-timestamp: 1640995200000" \
  -d '{"id": "test-stale", "event_type": "ON_ORDER_COMPLETED"}'
```

### Test 5: Missing Headers
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "test-no-headers", "event_type": "ON_ORDER_COMPLETED"}'
```

## Verification Steps

1. **Check Logs**: Go to Cloud Logging and filter by:
   ```
   jsonPayload.component="paynow_webhook"
   ```

2. **Check Firestore**: Verify in `webhookEvents` collection that:
   - Valid events have `status: "processed"`
   - Duplicate events are skipped (idempotent)
   - Invalid events are rejected before processing

3. **Check Wallet**: For valid events, verify points are credited in:
   ```
   users/OPvJByA50jQmxGrgsqmrn794Axd2/wallet/points
   ```

4. **Check TTL**: Verify `webhookEvents` documents have `expiresAt` field

## Expected Log Entries

For valid events, you should see structured logs like:
```json
{
  "severity": "INFO",
  "message": "Webhook processed successfully",
  "component": "paynow_webhook",
  "event_id": "test-...",
  "event_type": "ON_ORDER_COMPLETED", 
  "uid": "OPvJByA50jQmxGrgsqmrn794Axd2",
  "points": 50,
  "processing_ms": 150,
  "idempotent": false
}
```

For duplicate events:
```json
{
  "message": "Event already processed, skipping",
  "idempotent": true
}
```

## Next Steps

After manual verification:
1. ✅ Confirm all test scenarios work as expected
2. ✅ Verify structured logs appear in Cloud Logging  
3. ✅ Check that processing time is <250ms for valid requests
4. ✅ Verify idempotency works for duplicates
5. ✅ Confirm TTL field is present on webhookEvents
