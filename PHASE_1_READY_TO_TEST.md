# Phase 1 - Ready to Test

## 🧪 Test Environment Setup

### PowerShell Commands (Copy/Paste Ready)

```powershell
# 1. Set TEST environment variables
$env:PAYNOW_WEBHOOK_SECRET = "whsec_test_YOUR_TEST_SECRET_HERE"
$env:NEXT_PUBLIC_WEBSITE_URL = "https://siraj.life"

# 2. Verify environment variables
Write-Host "Webhook Secret Set: $($env:PAYNOW_WEBHOOK_SECRET -ne $null)"
Write-Host "Website URL: $env:NEXT_PUBLIC_WEBSITE_URL"

# 3. Navigate to test script directory
cd scripts

# 4. Check test script exists
Test-Path test-webhook-scenarios.ts
```

### Manual Test Commands

If automated script fails, use these manual commands:

#### Test 1: Happy Path
```bash
# Set your test values
$EVENT_ID = "test_happy_$(Get-Date -Format 'yyyyMMddHHmmss')"
$TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$TEST_UID = "YOUR_TEST_USER_UID"
$TEST_PRODUCT = "YOUR_TEST_PRODUCT_ID"

# Create payload
$PAYLOAD = @"
{
  "id": "$EVENT_ID",
  "event_type": "ON_ORDER_COMPLETED",
  "data": {
    "order": {
      "id": "test_order_$TIMESTAMP",
      "pretty_id": "TEST-$TIMESTAMP",
      "status": "completed",
      "payment_state": "paid",
      "customer": {
        "id": "test_customer_123",
        "email": "test@example.com",
        "metadata": {"uid": "$TEST_UID"}
      },
      "lines": [{
        "product_id": "$TEST_PRODUCT",
        "quantity": 1,
        "price": "5.00"
      }]
    }
  }
}
"@
```

## 📊 Monitoring Commands

### Check Logs in Real-Time
```bash
gcloud logging tail 'jsonPayload.component="paynow_webhook"' --format=json
```

### Check Recent Webhook Activity
```bash
gcloud logging read `
  'jsonPayload.component="paynow_webhook" AND timestamp>="5 minutes ago"' `
  --format="table(timestamp,jsonPayload.message,jsonPayload.event_id)" `
  --limit=10
```

### Check p95 Latency
```bash
gcloud logging read `
  'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' `
  --format="value(jsonPayload.processing_ms)" `
  --limit=100 | Sort-Object {[int]$_} | Select-Object -Last 5
```

## 🔍 Firestore Paths to Monitor

1. **Webhook Events**: `webhookEvents/{event_id}`
2. **User Wallet**: `users/{TEST_UID}/wallet/points`
3. **Ledger**: `users/{TEST_UID}/ledger/{entry_id}`

## 📸 Screenshot Checklist

Prepare to capture these:
1. Dashboard with data
2. All 5 alerts enabled
3. Alert that fired
4. Happy path logs
5. Firestore before/after
6. Network tab (zero POSTs)

---

## ⏱️ Test Timeline

| Step | Time | Action |
|------|------|--------|
| Setup | 0-5 min | Environment variables |
| Test 1 | 5-10 min | Happy path |
| Test 2 | 10-12 min | Duplicate |
| Test 3 | 12-15 min | Replay |
| Test 4 | 15-18 min | Bad signature |
| Test 5 | 18-20 min | Unmapped product |
| Verify | 20-25 min | Check metrics & logs |

---

**Ready to begin testing once pre-flight checks pass!**
