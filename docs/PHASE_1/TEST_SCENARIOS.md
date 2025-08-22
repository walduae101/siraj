# Phase 1: Test Scenarios & Validation

**Updated on: 2025-01-10**

---

## Overview

Comprehensive test scenarios to validate PayNow webhook security, performance, and monitoring functionality.

**Environment**: TEST ONLY  
**Prerequisites**: Test webhook secret, test product IDs, test user account

---

## Test Configuration

### Test Environment Values
- **Webhook URL**: `https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook`
- **Test Secret**: `pn-7cade0c6397c40da9b16f79ab5df132c` (TEST environment)
- **Test User UID**: `OPvJByA50jQmxGrgsqmrn794Axd2`
- **Test Product ID**: `prod_QQfmFQiRyeLPBZ` (50 points)

### Required Tools
- Browser with DevTools (Network tab monitoring)
- Access to Cloud Console (Logs, Monitoring, Firestore)
- Command line with curl or equivalent

---

## Test Scenarios

### Test 1: Valid Purchase ✅

**Objective**: Verify end-to-end webhook processing

**Test Command**:
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: [CALCULATE_BASE64_HMAC]" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{
    "id": "test-valid-'$(date +%s)'",
    "event_type": "ON_ORDER_COMPLETED",
    "data": {
      "order": {
        "id": "order-123",
        "pretty_id": "ORD-2025-001",
        "customer": {
          "id": "cust-456",
          "email": "testuser123@test.com",
          "metadata": {"uid": "OPvJByA50jQmxGrgsqmrn794Axd2"}
        },
        "lines": [{
          "product_id": "prod_QQfmFQiRyeLPBZ",
          "quantity": 1,
          "price": "5.00"
        }]
      }
    }
  }'
```

**Expected Results**:
- **HTTP Status**: 200 OK
- **Processing Time**: <250ms
- **Response**: `{"ok": true, "status": "processed", "details": {...}}`

**Log Verification**:
```json
{
  "severity": "INFO",
  "message": "Webhook processed successfully", 
  "component": "paynow_webhook",
  "event_id": "test-valid-...",
  "event_type": "ON_ORDER_COMPLETED",
  "uid": "OPvJByA50jQmxGrgsqmrn794Axd2", 
  "points": 50,
  "processing_ms": 150,
  "idempotent": false
}
```

**Firestore Verification**:
- `webhookEvents/{eventId}`: status = "processed", expiresAt present
- `users/{uid}/wallet/points`: paidBalance increased by 50
- `users/{uid}/ledger/{entryId}`: new credit entry

**Metrics Impact**: requests +1, points_credited +50

---

### Test 2: Duplicate Event Detection 🔁

**Objective**: Verify idempotency works correctly

**Test Command**: Run Test 1 command again with identical `id` field

**Expected Results**:
- **HTTP Status**: 200 OK
- **Processing Time**: <50ms (faster due to early exit)
- **Response**: `{"ok": true, "status": "already_processed"}`

**Log Verification**:
```json
{
  "message": "Event already processed, skipping",
  "idempotent": true,
  "processing_ms": 25
}
```

**Firestore Verification**: 
- No additional wallet changes
- No duplicate ledger entries
- webhookEvents status remains "processed"

**Metrics Impact**: requests +1, points_credited +0

---

### Test 3: Bad Signature Security 🔐

**Objective**: Verify signature validation rejects invalid requests

**Test Command**:
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: invalid_signature_test" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{"id": "test-bad-sig-'$(date +%s)'", "event_type": "ON_ORDER_COMPLETED"}'
```

**Expected Results**:
- **HTTP Status**: 401 Unauthorized
- **Processing Time**: <50ms
- **Response**: "Invalid signature"

**Log Verification**:
```json
{
  "severity": "WARNING",
  "message": "Webhook rejected - invalid signature",
  "rejection_reason": "invalid_signature"
}
```

**Metrics Impact**: requests +1, failures +1  
**Alert**: May trigger "Processing Failures" alert

---

### Test 4: Replay Protection ⏰

**Objective**: Verify timestamp validation prevents replay attacks

**Test Command**:
```bash
# Use timestamp from 10 minutes ago
OLD_TIMESTAMP=$(($(date +%s) - 600))000

curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: [CALCULATE_WITH_OLD_TIMESTAMP]" \
  -H "paynow-timestamp: $OLD_TIMESTAMP" \
  -d '{"id": "test-replay-'$(date +%s)'", "event_type": "ON_ORDER_COMPLETED"}'
```

**Expected Results**:
- **HTTP Status**: 401 Unauthorized
- **Processing Time**: <50ms
- **Response**: "Invalid timestamp"

**Log Verification**:
```json
{
  "severity": "WARNING",
  "message": "Webhook rejected - invalid timestamp", 
  "rejection_reason": "invalid_timestamp",
  "timestamp": "1640995200000"
}
```

**Metrics Impact**: requests +1, failures +1

---

### Test 5: Missing Headers ❓

**Objective**: Verify required headers are enforced

**Test Command**:
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "test-no-headers-'$(date +%s)'", "event_type": "ON_ORDER_COMPLETED"}'
```

**Expected Results**:
- **HTTP Status**: 401 Unauthorized  
- **Processing Time**: <50ms
- **Response**: "Invalid signature"

**Log Verification**:
```json
{
  "severity": "WARNING",
  "message": "Webhook rejected - invalid signature",
  "rejection_reason": "invalid_signature",
  "headers": ["content-type", "content-length", ...]
}
```

**Metrics Impact**: requests +1, failures +1

---

## HMAC Signature Calculation

### PayNow Signature Format
- **Algorithm**: HMAC-SHA256
- **Encoding**: **base64** (not hex)
- **Headers**: **lowercase** (`paynow-signature`, `paynow-timestamp`)
- **Payload**: `timestamp.requestBody`

### Example Calculation (bash)
```bash
TIMESTAMP=$(date +%s)000  # milliseconds
PAYLOAD='{"id":"test","event_type":"ON_ORDER_COMPLETED"}'
MESSAGE="$TIMESTAMP.$PAYLOAD"
SECRET="pn-7cade0c6397c40da9b16f79ab5df132c"

SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)
echo "paynow-signature: $SIGNATURE"
echo "paynow-timestamp: $TIMESTAMP"
```

---

## Verification Procedures

### 1. Log Analysis
**Query**: `jsonPayload.component="paynow_webhook"`

**Required Fields in Logs**:
- `event_id` - Unique event identifier
- `event_type` - PayNow event type
- `processing_ms` - Processing latency
- `idempotent` - true/false for duplicate detection
- `uid` - Firebase user ID (when resolved)
- `points` - Points credited (when applicable)

### 2. Firestore Validation

**Collections to Check**:
- `webhookEvents/{eventId}` - Event tracking with TTL
- `users/{uid}/wallet/points` - Wallet balance updates
- `users/{uid}/ledger/{entryId}` - Transaction history

**Required Fields**:
- `webhookEvents`: status, expiresAt, receivedAt, processedAt
- `wallet/points`: paidBalance, promoBalance, updatedAt  
- `ledger`: type, amount, source, actionId, createdAt

### 3. Metrics Validation

**Check Dashboard Widgets**:
- Request rate showing activity
- Failure rate staying low (<1%)
- Points credited matching test amounts
- Latency p95 <250ms

### 4. Alert Validation

**Test Alert Firing**:
1. Send bad signature webhook (should trigger failures alert)
2. Wait 1-2 minutes for alert evaluation
3. Check email for notification
4. Verify alert shows in policies console

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Webhook Response | <250ms p95 | processing_ms in logs |
| Valid Requests | 200 OK | HTTP status |
| Invalid Requests | 401 Unauthorized | HTTP status |
| Idempotency | <50ms | Duplicate request latency |
| Alert Response | <2 minutes | Email notification time |

---

## Success Criteria

Phase 1 monitoring is complete when:

- ✅ All 4 metrics created and ingesting data
- ✅ Dashboard imported and showing real-time data
- ✅ 6 alert policies active with email notifications
- ✅ All 5 test scenarios pass with expected results
- ✅ p95 processing latency <250ms sustained
- ✅ Zero client-side write operations confirmed
- ✅ Email alerts verified working

---

## Troubleshooting

### Common Issues

**Metrics Not Populating**:
- Verify structured logging format
- Check log filter syntax exactly matches
- Wait 2-3 minutes for ingestion lag
- Re-run test scenarios

**Dashboard Shows "No Data"**:
- Expand time range to 6 hours
- Verify metrics exist and have data
- Refresh browser page
- Check dashboard JSON import was successful

**Alerts Not Firing**:
- Verify notification channel is verified (check email)
- Confirm alert policies are enabled
- Check threshold values match test conditions
- Wait for evaluation window to complete

**High Latency**:
- Check for cold starts (first request after deployment)
- Verify no blocking operations in webhook code
- Review Cloud Run CPU/memory metrics
- Consider increasing Cloud Run resources

---

For operational procedures after deployment, see [Webhook Runbook](../RUNBOOKS/WEBHOOK_RUNBOOK.md).
