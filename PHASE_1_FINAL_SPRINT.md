# 🚀 Phase 1 Final Sprint - Action Checklist

**Goal**: Complete Phase 1 with correct dashboard import and working alerts
**Time Estimate**: 30-45 minutes

---

## ✅ Task 1: Import Dashboard (Correct Method)

**Steps**:
1. Go to **Monitoring → Dashboards**
2. Click **Create custom dashboard**
3. Click **⋮ menu** (top-right) → **Import JSON** (NOT Grafana)
4. Upload: `monitoring/paynow-webhook-dashboard.json`
5. Click **Save**

**Verify**: Dashboard shows tiles for:
- [ ] Webhook requests/failures
- [ ] Points credited
- [ ] Latency (empty until metric fixed)

---

## ✅ Task 2: Fix Latency Metric (Counter → Distribution)

**Steps**:
1. Go to **Logging → Logs-based metrics**
2. Click **Create metric**
3. Configure:
   - **Name**: `paynow_webhook_latency`
   - **Type**: **Distribution** ⚠️
   - **Log filter**: 
     ```
     jsonPayload.component="paynow_webhook"
     jsonPayload.processing_ms>0
     ```
   - **Field name**: `jsonPayload.processing_ms`
   - **Units**: `ms`
4. Click **Create**
5. Optional: Disable old Counter metric

**Test**: Run one webhook test to populate the new metric

---

## ✅ Task 3: Create 5 Alert Policies

### Alert A: Failure Rate > 1%
1. **Monitoring → Alerting → Create policy**
2. **Add condition (Builder mode)**
3. **Primary metric**: `paynow_webhook_requests`
   - Rolling window: 1 min
   - Function: rate
   - Across time series: sum
4. **Add secondary transformation**:
   - Arithmetic: `rate(paynow_webhook_failures) / rate(paynow_webhook_requests)`
5. **Threshold**: is above **0.01**
6. **For**: 5 minutes
7. **Notification**: PayNow Webhook Alerts
8. **Name**: "PayNow Webhook - High Failure Rate"

### Alert B: No Requests for 15 min
1. New policy → **Metric**: `paynow_webhook_requests`
2. Rolling window: 1 min, Function: rate, Across: sum
3. **Condition**: is below **0.000001** for **15 minutes**
4. **Name**: "PayNow Webhook - No Requests"

### Alert C: p95 Latency > 5s
1. New policy → **Metric**: `paynow_webhook_latency` (Distribution)
2. Rolling window: 1 min
3. **Function**: **percentile (95)**
4. Across time series: max
5. **Condition**: is above **5000** ms for **5 minutes**
6. **Name**: "PayNow Webhook - High Latency"

### Alert D: Any Failures
1. New policy → **Metric**: `paynow_webhook_failures`
2. Rolling window: 1 min, Function: sum, Across: sum
3. **Condition**: is above **0** for **1 minute**
4. **Name**: "PayNow Webhook - Failures Detected"

### Alert E: No Credits for 30 min
1. New policy → **Metric**: `paynow_points_credited`
2. Rolling window: 1 min, Function: rate, Across: sum
3. **Condition**: is below **0.000001** for **30 minutes**
4. **Name**: "PayNow Webhook - No Credits"

**💡 Test Tip**: Use shorter windows (1-2 min) for testing, then restore

---

## ✅ Task 4: IAM Quick Check

Verify you have:
- [ ] Monitoring Admin
- [ ] Logs Configuration Writer
- [ ] Project Viewer

**Check**: https://console.cloud.google.com/iam-admin/iam?project=walduae-project-20250809071906

---

## ✅ Task 5: Run Test Scenarios

Using existing test script:
```powershell
npx tsx scripts/test-webhook-scenarios.ts
```

Expected outcomes:
1. **Valid purchase** → Wallet credited ✅
2. **Duplicate** → Skipped ✅
3. **Bad signature** → 401 + alert triggers
4. **Old timestamp** → 401 replay rejection
5. **Quiet period** → Wait for no-request alerts

---

## ✅ Task 6: Verify p95 < 250ms

1. Open dashboard
2. Find latency chart
3. Set percentile to **p95**
4. Check last 30 minutes
5. **Target**: < 250ms

---

## 📸 Screenshots to Capture

1. [ ] Dashboard with live data
2. [ ] Alert policies list (all 5)
3. [ ] Alert firing email
4. [ ] Logs showing `processing_ms`
5. [ ] Firestore `webhookEvents` with `expiresAt`

---

## 🎯 Success Criteria

- [ ] Dashboard imported correctly
- [ ] Latency metric is Distribution type
- [ ] 5 alerts created and enabled
- [ ] Test scenarios pass
- [ ] p95 latency < 250ms
- [ ] Screenshots captured

---

**Estimated completion**: 30-45 minutes
