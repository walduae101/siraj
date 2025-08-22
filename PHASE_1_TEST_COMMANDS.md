# Phase 1 - Test Commands Ready to Execute

## 🚀 Quick Start Test Commands

### Pre-Test Setup
```powershell
# Set your test user ID (replace with actual test user)
$testUserId = "test-user-123"
$testEventId = Get-Date -Format "yyyyMMddHHmmss"
```

### Test 1: Happy Path (Mapped Product)
```powershell
# Send valid webhook with mapped product
$body = @{
    event_id = "happy-$testEventId-1"
    event_type = "order.paid"
    data = @{
        order = @{
            id = "ORD-$testEventId-1"
            customer_email = "$testUserId@test.com"
            items = @(
                @{
                    product_id = "prod_QQfmFQiRyeLPBZ"  # 1000 points
                    quantity = 1
                }
            )
        }
    }
} | ConvertTo-Json -Depth 5

# TODO: Add HMAC signature calculation
curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "X-PayNow-Signature: <calculate-signature>" `
  -d $body
```

### Test 2: Duplicate Event
```powershell
# Send same event again (should be skipped)
curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "X-PayNow-Signature: <calculate-signature>" `
  -d $body
```

### Test 3: Replay Attack (Old Timestamp)
```powershell
# Send event with old timestamp
$oldTimestamp = [DateTimeOffset]::UtcNow.AddMinutes(-10).ToUnixTimeSeconds()
$replayBody = @{
    event_id = "replay-$testEventId-3"
    event_type = "order.paid"
    timestamp = $oldTimestamp
    data = @{
        order = @{
            id = "ORD-$testEventId-3"
            customer_email = "$testUserId@test.com"
            items = @(
                @{
                    product_id = "prod_QQfmFQiRyeLPBZ"
                    quantity = 1
                }
            )
        }
    }
} | ConvertTo-Json -Depth 5

curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "X-PayNow-Signature: <calculate-signature>" `
  -H "X-PayNow-Timestamp: $oldTimestamp" `
  -d $replayBody
```

### Test 4: Bad Signature
```powershell
# Send with invalid signature
$badSigBody = @{
    event_id = "badsig-$testEventId-4"
    event_type = "order.paid"
    data = @{
        order = @{
            id = "ORD-$testEventId-4"
            customer_email = "$testUserId@test.com"
            items = @(
                @{
                    product_id = "prod_QQfmFQiRyeLPBZ"
                    quantity = 1
                }
            )
        }
    }
} | ConvertTo-Json -Depth 5

curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "X-PayNow-Signature: invalid-signature-123" `
  -d $badSigBody
```

### Test 5: Unmapped Product
```powershell
# Send with unmapped product
$unmappedBody = @{
    event_id = "unmapped-$testEventId-5"
    event_type = "order.paid"
    data = @{
        order = @{
            id = "ORD-$testEventId-5"
            customer_email = "$testUserId@test.com"
            items = @(
                @{
                    product_id = "prod_UNKNOWN123"
                    quantity = 1
                }
            )
        }
    }
} | ConvertTo-Json -Depth 5

curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "X-PayNow-Signature: <calculate-signature>" `
  -d $unmappedBody
```

---

## 📊 Verification Queries

### Check Logs (Logs Explorer)
```
jsonPayload.component="paynow_webhook"
jsonPayload.event_id=~".*-20250110.*"
```

### Check Firestore
1. Go to: https://console.cloud.google.com/firestore/data/panel/users?project=walduae-project-20250809071906
2. Navigate to: `users/{testUserId}/wallet/points`
3. Check: `users/{testUserId}/ledger`
4. Check: `webhookEvents` collection

### Check Metrics Dashboard
https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906

---

## ⚠️ Note: HMAC Signature Required

The webhook endpoint requires valid HMAC-SHA256 signatures. You'll need:
1. The TEST webhook secret from Secret Manager
2. A way to calculate HMAC signatures

See `scripts/test-webhook-scenarios.ts` for the TypeScript implementation.