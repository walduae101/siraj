# Phase 1 Activation Steps - Click-by-Click Guide

## 0) Prechecks (1-2 min)

### Check Cloud Run Service Account Roles

1. Go to: https://console.cloud.google.com/run/detail/us-central1/siraj/details?project=walduae-project-20250809071906
2. Click "REVISIONS" tab
3. Note the Service account email (e.g., `PROJECT-compute@developer.gserviceaccount.com`)
4. Go to: https://console.cloud.google.com/iam-admin/iam?project=walduae-project-20250809071906
5. Find the service account in the list
6. Verify it has:
   - ✅ Logs Writer
   - ✅ Monitoring Metric Writer

### Check Your User Roles

1. In IAM page, find your email
2. Verify you have:
   - ✅ Monitoring Admin
   - ✅ Logs Configuration Writer

**STOP if any roles are missing - request them first!**

---

## 1) Metrics & Dashboard (5-8 min)

### Import Dashboard

1. Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
2. Click "**+ CREATE DASHBOARD**" → "**Upload**"
3. Click "**BROWSE**" and select `monitoring/paynow-webhook-dashboard.json`
4. Click "**UPLOAD**"
5. Dashboard should appear as "PayNow Webhook Monitoring"

### Verify Metrics Exist

1. Go to: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906
2. Look for these 4 user-defined metrics:
   - ✅ `paynow_webhook_requests`
   - ✅ `paynow_webhook_failures`
   - ✅ `paynow_points_credited`
   - ✅ `paynow_webhook_latency`
3. Click each metric to see its definition

### Check Dashboard (will be empty until tests)

1. Return to dashboards
2. Open "PayNow Webhook Monitoring"
3. Set time range to "**6 hours**"
4. Note: Charts will say "No data" - this is normal before testing

---

## 2) Alert Policies (8-10 min)

### Alert 1: Failure Rate Spike

1. Go to: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906
2. Click "**SELECT A METRIC**"
3. Filter by: "**User-defined metrics**"
4. Select "**logging/user/paynow_webhook_failures**"
5. Click "**APPLY**"
6. Under "Transform data":
   - Aggregator: **rate**
   - Period: **1 min**
7. Click "**NEXT**"
8. Configure trigger:
   - Condition type: **Threshold**
   - Alert trigger: **Any time series violates**
   - Threshold value: **0.01** (1%)
   - For: **5 minutes**
9. Click "**NEXT**"
10. Add notification channel (your email)
11. Name: "PayNow Webhook - High Failure Rate"
12. Click "**CREATE POLICY**"

### Alert 2: No Credits

1. Create new policy
2. Select metric: "**logging/user/paynow_points_credited**"
3. Transform: 
   - Aggregator: **sum**
   - Period: **1 min**
4. Configure trigger:
   - Condition type: **Metric absence**
   - Trigger absence: **30 minutes**
5. Name: "PayNow Webhook - No Credits Processed"

### Alert 3: High Latency

1. Create new policy
2. Select metric: "**logging/user/paynow_webhook_latency**"
3. Transform:
   - Aggregator: **95th percentile**
   - Period: **1 min**
4. Configure trigger:
   - Threshold value: **5000** (5 seconds)
   - For: **5 minutes**
5. Name: "PayNow Webhook - High Latency"

### Alert 4: Endpoint Down

1. Go to: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906
2. Click "**+ CREATE UPTIME CHECK**"
3. Configure:
   - Protocol: **HTTPS**
   - Resource Type: **URL**
   - Hostname: **siraj.life**
   - Path: **/api/paynow/webhook**
   - Check Frequency: **5 minutes**
4. Click "**CONTINUE**"
5. Response Validation:
   - Response Timeout: **10 seconds**
   - Status codes: Add **401** and **405** (remove 200)
6. Click "**CONTINUE**"
7. Alert: Toggle "**Create an alert**" ON
8. Name: "PayNow Webhook Health Check"
9. Click "**CREATE**"

### Alert 5: Signature Problems

1. Create new policy
2. Click "**METRIC ABSENT OR BELOW THRESHOLD**" → Change to "**LOGS-BASED METRIC**"
3. Click "**BUILD A QUERY**"
4. Enter query:
   ```
   jsonPayload.component="paynow_webhook"
   jsonPayload.rejection_reason="invalid_signature"
   ```
5. Click "**RUN QUERY**" to test
6. Click "**NEXT**"
7. Configure:
   - Aggregator: **count**
   - Threshold: **5**
   - For: **5 minutes**
8. Name: "PayNow Webhook - Signature Verification Failures"

---

## 3) Test Scenarios (10-15 min)

### Prerequisites

1. Ensure you have test environment configured
2. Have test webhook secret in environment
3. Know your test user ID and test product ID

### Run Tests Using Script

1. Open terminal in project root
2. Set environment:
   ```powershell
   $env:PAYNOW_WEBHOOK_SECRET = "your_test_webhook_secret"
   $env:NEXT_PUBLIC_WEBSITE_URL = "https://siraj.life"
   ```
3. Run test script:
   ```powershell
   cd scripts
   npx tsx test-webhook-scenarios.ts
   ```

### Monitor Results for Each Test

For each scenario, verify in separate browser tabs:

1. **Logs**: https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906
   - Query: `jsonPayload.component="paynow_webhook"`
   
2. **Dashboard**: https://console.cloud.google.com/monitoring/dashboards
   - Watch counters increase

3. **Firestore**: https://console.cloud.google.com/firestore/data/panel/users?project=walduae-project-20250809071906
   - Check wallet balance changes

### Expected Results

| Scenario | Logs | Metrics | Firestore |
|----------|------|---------|-----------|
| A. Happy Path | "Webhook processed successfully" | requests+1, points+N | Balance increased |
| B. Duplicate | "already processed" | requests+1, no points | No change |
| C. Stale Time | "invalid timestamp" | failures+1 | No change |
| D. Bad Sig | "invalid signature" | failures+1, alert fires | No change |
| E. Unmapped | "unmapped_product" | failures+1 | No change |

---

## 4) Performance Verification (3-5 min)

1. Go to dashboard
2. Find "Processing Latency (ms)" chart
3. Look at p95 line
4. **✅ PASS** if < 250ms
5. **❌ FAIL** if > 250ms - investigate:
   - Check for cold starts
   - Review structured logging placement
   - Check for blocking operations

---

## 5) Success Page Verification (1-2 min)

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Navigate to: https://siraj.life/checkout/success?order_id=TEST-123
4. Watch network traffic
5. **✅ PASS** if zero POST/PUT/PATCH requests
6. **❌ FAIL** if any write operations detected

---

## 6) Documentation (3-5 min)

### Take Screenshots

1. **Dashboard with data**
   - Show all widgets populated
   - Include time range selector

2. **Alert policies list**
   - Go to: https://console.cloud.google.com/monitoring/alerting/policies
   - Show all 5 policies

3. **Fired alert**
   - Click on "Signature Verification Failures" policy
   - Show incidents tab with fired alert

4. **Happy path logs**
   - Filter logs by successful event_id
   - Show full structured trail

5. **Firestore before/after**
   - Show wallet document with increased balance

### Update Report

1. Edit `PHASE_1_COMPLETION_REPORT.md`
2. Add section "## Screenshots"
3. Reference each screenshot
4. Update checklist at bottom

---

## ✅ Final Acceptance Checklist

Copy this to your completion report:

```markdown
## Phase 1 Acceptance

- [x] No userPoints, checkout.complete, or client wallet writes in prod code
- [x] Success page performs zero writes
- [x] Metrics showing data:
  - [x] paynow_webhook_requests
  - [x] paynow_webhook_failures  
  - [x] paynow_points_credited
  - [x] paynow_webhook_latency
- [x] Dashboard imported and populated
- [x] 5 alerts created:
  - [x] Failure rate spike
  - [x] No credits
  - [x] High latency
  - [x] Endpoint down
  - [x] Signature problems
- [x] Test scenarios completed:
  - [x] Happy path - credited successfully
  - [x] Duplicate - idempotent skip
  - [x] Stale timestamp - rejected
  - [x] Bad signature - rejected + alert
  - [x] Unmapped product - rejected
- [x] p95 latency < 250ms verified
- [x] Screenshots documented
```

---

## 🎉 Phase 1 Complete!

Once all checkboxes are ticked:
1. Save all documentation
2. Commit changes
3. Ready for Phase 2 (Queue/Worker split)

