# PayNow Webhook Test Scenarios Guide

⚠️ **TEST ENVIRONMENT ONLY** ⚠️

## Prerequisites

1. **CRITICAL: Verify TEST environment**
   - [ ] Using TEST webhook secret (NOT production)
   - [ ] Using TEST product IDs (NOT production)
   - [ ] Cloud Run service = TEST instance
   - [ ] PayNow dashboard = TEST store

2. **Environment Variables**
   ```powershell
   $env:PAYNOW_WEBHOOK_SECRET = "whsec_test_..." # TEST secret only!
   $env:NEXT_PUBLIC_WEBSITE_URL = "https://siraj.life"
   ```

3. **Test Product IDs**
   - Update in `scripts/test-webhook-scenarios.ts`
   - Must match TEST environment product mappings
   - Never use production product IDs

## Running Test Scenarios

### Option 1: Using the Test Script

```bash
# Load environment variables
npm run dev  # In one terminal to start the server

# In another terminal
cd scripts
npx tsx test-webhook-scenarios.ts
```

### Option 2: Manual Testing with cURL

#### Scenario 1: Valid Purchase

```bash
# Generate timestamp
TIMESTAMP=$(date +%s)

# Create payload
PAYLOAD='{
  "id": "test_'$TIMESTAMP'_valid",
  "event_type": "ON_ORDER_COMPLETED",
  "data": {
    "order": {
      "id": "test_order_123",
      "pretty_id": "TEST-123",
      "status": "completed",
      "payment_state": "paid",
      "customer": {
        "id": "test_customer_123",
        "email": "test@example.com",
        "metadata": {"uid": "YOUR_TEST_USER_ID"}
      },
      "lines": [{
        "product_id": "YOUR_PRODUCT_ID",
        "quantity": 1,
        "price": "5.00"
      }]
    }
  }
}'

# Create signature (requires PAYNOW_WEBHOOK_SECRET)
MESSAGE="$TIMESTAMP.$PAYLOAD"
SIGNATURE=$(echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$PAYNOW_WEBHOOK_SECRET" -binary | base64)

# Send request
curl -X POST https://siraj.life/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-timestamp: $TIMESTAMP" \
  -H "paynow-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

#### Scenario 2: Duplicate Event (Idempotency Test)

Run the same request twice with identical event ID to test idempotency.

#### Scenario 3: Bad Signature

```bash
curl -X POST https://siraj.life/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-timestamp: $TIMESTAMP" \
  -H "paynow-signature: invalid_signature_12345" \
  -d "$PAYLOAD"
```

Expected: 401 Unauthorized

#### Scenario 4: Stale Timestamp

```bash
# Use timestamp from 10 minutes ago
OLD_TIMESTAMP=$(($(date +%s) - 600))

curl -X POST https://siraj.life/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-timestamp: $OLD_TIMESTAMP" \
  -H "paynow-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

Expected: 401 Unauthorized

#### Scenario 5: Missing Headers

```bash
curl -X POST https://siraj.life/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

Expected: 401 Unauthorized

## Verification Steps

### 1. Check Structured Logs

```bash
gcloud logging read 'jsonPayload.component="paynow_webhook"' \
  --limit=20 \
  --format="json" \
  --project=walduae-project-20250809071906
```

### 2. Check Metrics

Go to: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906

Verify counts for:
- paynow_webhook_requests (should increase with each test)
- paynow_webhook_failures (should increase with bad signature/timestamp)
- paynow_points_credited (should show credited amounts)

### 3. Check Dashboard

Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906

Look for "PayNow Webhook Monitoring" dashboard. Verify:
- Request rate chart shows activity
- Failure rate stays below 1% for valid requests
- Points credited by product shows data
- Latency charts show p50/p95 values

### 4. Check Firestore

Verify in Firestore Console:
- `webhookEvents/{eventId}` - New documents with status and expiresAt
- `users/{uid}/wallet/points` - Balance increased (for valid purchase)
- `users/{uid}/ledger/{entryId}` - New transaction entries

### 5. Performance Check

```bash
# Get p95 latency from recent logs
gcloud logging read \
  'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' \
  --format="value(jsonPayload.processing_ms)" \
  --limit=100 \
  --project=walduae-project-20250809071906 | \
  sort -n | \
  tail -n 5
```

Target: p95 < 250ms

## Expected Results Summary

| Scenario | HTTP Status | Log Message | Metrics Impact |
|----------|-------------|-------------|----------------|
| Valid Purchase | 200 | "Webhook processed successfully" | requests+1, credited+points |
| Duplicate (1st) | 200 | "Webhook processed successfully" | requests+1, credited+points |
| Duplicate (2nd) | 200 | "Webhook already processed" | requests+1, no credits |
| Bad Signature | 401 | "Webhook rejected - invalid signature" | requests+1, failures+1 |
| Stale Timestamp | 401 | "Webhook rejected - invalid timestamp" | requests+1, failures+1 |
| Missing Headers | 401 | "Webhook rejected - invalid signature" | requests+1, failures+1 |

## Troubleshooting

If metrics don't appear:
1. Wait 2-3 minutes for log ingestion
2. Verify structured logs format: `gcloud logging read 'resource.type="cloud_run_revision"' --limit=10`
3. Check metric definitions in Cloud Console

If dashboard is empty:
1. Ensure test traffic was sent
2. Adjust time range to "Last 1 hour"
3. Refresh the page

If you see unexpected errors:
1. Check Cloud Run logs: https://console.cloud.google.com/run/detail/us-central1/siraj/logs
2. Verify webhook secret is correctly configured
3. Ensure test user exists in Firestore
