# ✅ Phase 1 - Final Alert Creation Guide

Since the CLI approach hit some issues, here's the **quickest manual approach**:

## 🎯 Quick Links
- **Create Alert**: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906
- **View All Alerts**: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906

---

## 📋 Copy-Paste Ready Alert Configurations

### Alert 1: High Failure Rate > 1%

1. Click **+ CREATE POLICY**
2. **Add condition** → **Builder**
3. **Resource & Metric**:
   - Type in search: `paynow_webhook_requests`
   - Select the metric
4. **Transform data**:
   - Rolling window: **1 min**
   - Function: **rate**
   - Across time series: **sum**
5. **Add another metric** (click + icon):
   - Search: `paynow_webhook_failures`
   - Rolling window: **1 min**
   - Function: **rate**
   - Across time series: **sum**
6. **Apply arithmetic**:
   - Select: **B/A** (failures/requests)
7. **Configure trigger**:
   - Condition: **is above**
   - Threshold: **0.01**
   - For: **5 minutes**
8. **Notifications**: Select **PayNow Webhook Alerts**
9. **Name**: `PayNow Webhook - High Failure Rate`
10. **CREATE POLICY**

---

### Alert 2: No Requests (15 min)

1. **+ CREATE POLICY**
2. **Metric**: `paynow_webhook_requests`
3. **Transform**: rate, sum
4. **Trigger**: is below **0.000001** for **15 minutes**
5. **Name**: `PayNow Webhook - No Requests`

---

### Alert 3: p95 Latency > 5s

1. **+ CREATE POLICY**
2. **Metric**: `paynow_webhook_latency`
3. **Transform**: 
   - Rolling window: **1 min**
   - Function: **percentile 95**
   - Across: **max**
4. **Trigger**: is above **5000** for **5 minutes**
5. **Name**: `PayNow Webhook - High Latency`

---

### Alert 4: Any Failures

1. **+ CREATE POLICY**
2. **Metric**: `paynow_webhook_failures`
3. **Transform**: sum, sum
4. **Trigger**: is above **0** for **1 minute**
5. **Name**: `PayNow Webhook - Failures Detected`

---

### Alert 5: No Credits (30 min)

1. **+ CREATE POLICY**
2. **Metric**: `paynow_points_credited`
3. **Transform**: rate, sum
4. **Trigger**: is below **0.000001** for **30 minutes**
5. **Name**: `PayNow Webhook - No Credits`

---

## ⏱️ Time Estimate

Each alert takes ~2 minutes to create manually.
**Total time**: 10-15 minutes

---

## 🧪 Quick Test

After creating alerts, run a bad signature test to trigger the "Failures Detected" alert:

```powershell
curl -X POST https://siraj.life/api/paynow/webhook `
  -H "Content-Type: application/json" `
  -H "paynow-signature: bad-signature" `
  -H "paynow-timestamp: $(Get-Date -UFormat %s)000" `
  -d '{"event_id":"test-alert-trigger"}'
```

---

## ✅ Success Criteria

After creating all 5 alerts:
1. All show **Enabled** status
2. All have **PayNow Webhook Alerts** notification channel
3. Dashboard shows data from earlier tests
4. Bad signature test triggers alert

---

**This manual approach will definitely work!** Each alert uses the Builder UI which is straightforward.
