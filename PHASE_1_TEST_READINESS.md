# Phase 1 Test Readiness Checklist

## Before You Start Testing

### Environment Setup ✓

- [ ] **Test webhook secret configured**
  ```powershell
  # Verify you have the test secret (not production!)
  $env:PAYNOW_WEBHOOK_SECRET = "whsec_test_..."
  ```

- [ ] **Test product IDs identified**
  - Check Secret Manager for test product mappings
  - Note at least one valid product ID for happy path test
  - Note one invalid product ID for unmapped test

- [ ] **Test user account ready**
  - Have a test Firebase user UID
  - Or ability to create one via test auth flow

- [ ] **PayNow test mode confirmed**
  - Using test API keys (not production)
  - Test webhook endpoint configured in PayNow dashboard

### Tools Open in Browser Tabs ✓

1. [ ] **Logs Explorer**
   ```
   https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906
   Query ready: jsonPayload.component="paynow_webhook"
   ```

2. [ ] **Monitoring Dashboard**
   ```
   https://console.cloud.google.com/monitoring/dashboards
   "PayNow Webhook Monitoring" open
   Time range: Last 1 hour
   ```

3. [ ] **Firestore Data Viewer**
   ```
   https://console.cloud.google.com/firestore/data/panel/users
   Ready to check wallet balance changes
   ```

4. [ ] **Alert Policies**
   ```
   https://console.cloud.google.com/monitoring/alerting/policies
   To verify alerts fire during tests
   ```

### Terminal Ready ✓

- [ ] **Project root terminal**
  ```powershell
  cd C:\projects\siraj
  ```

- [ ] **Environment variables set**
  ```powershell
  $env:PAYNOW_WEBHOOK_SECRET = "your_test_secret"
  $env:NEXT_PUBLIC_WEBSITE_URL = "https://siraj.life"
  ```

- [ ] **Test script accessible**
  ```powershell
  # Verify script exists
  Test-Path scripts\test-webhook-scenarios.ts
  ```

### Manual Test Payload Template ✓

Save this for manual testing if needed:

```json
{
  "id": "test_manual_001",
  "event_type": "ON_ORDER_COMPLETED",
  "data": {
    "order": {
      "id": "manual_order_001",
      "pretty_id": "MANUAL-001",
      "status": "completed",
      "payment_state": "paid",
      "customer": {
        "id": "test_customer_123",
        "email": "test@example.com",
        "metadata": {
          "uid": "YOUR_TEST_USER_UID"
        }
      },
      "lines": [{
        "product_id": "YOUR_TEST_PRODUCT_ID",
        "quantity": 1,
        "price": "5.00"
      }]
    }
  }
}
```

### Pre-Test Verification ✓

- [ ] **Webhook endpoint accessible**
  ```powershell
  # Should return 405 Method Not Allowed
  curl -I https://siraj.life/api/paynow/webhook
  ```

- [ ] **No recent errors in logs**
  ```powershell
  # Check for any recent errors
  gcloud logging read 'severity="ERROR" AND resource.labels.service_name="siraj"' --limit=5
  ```

- [ ] **Cloud Run service healthy**
  - Check https://console.cloud.google.com/run
  - Verify "siraj" service is running
  - No recent failed deployments

## Ready to Test?

If all boxes checked: 
1. Start with happy path test (Scenario A)
2. Watch logs in real-time
3. Verify each expected behavior
4. Document any issues

If any box unchecked:
1. Resolve the missing item
2. Don't proceed until ready
3. Ask for help if blocked

## Quick Troubleshooting

**Can't find test webhook secret?**
- Check Secret Manager
- Look for keys ending in "_test"
- Contact team for test credentials

**Product IDs not working?**
- Verify using test environment IDs (not production)
- Check Secret Manager has test product mappings
- Try a known test product ID

**Logs not appearing?**
- Wait 10-15 seconds for ingestion
- Check Cloud Run is receiving requests
- Verify structured logging format

**Firestore not updating?**
- Ensure test user exists
- Check wallet path: `users/{uid}/wallet/points`
- Verify no permission errors in logs

