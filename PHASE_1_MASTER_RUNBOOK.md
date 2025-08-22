# Phase 1 Activation — Master Runbook

**Environment**: TEST ONLY  
**Time Required**: 35-45 minutes  
**Prerequisites**: PayNow test store access, test webhook secret, test card

---

## 0) Scope & Guardrails ⚡

- [ ] Using PayNow **test store** (not production)
- [ ] Using **test webhook secret** (not production)
- [ ] Using **test card** for purchases
- [ ] Webhook URL points to **test** Cloud Run service
- [ ] DevTools Network tab open for success page verification

---

## 1) IAM Verification (5 min) 🔐

### Cloud Run Service Account
Check at: https://console.cloud.google.com/iam-admin/iam?project=walduae-project-20250809071906

- [ ] **Logs Writer**
- [ ] **Monitoring Metric Writer**
- [ ] **Cloud Trace Agent** (optional)
- [ ] **Firestore User**

### Your User Account
- [ ] **Monitoring Admin**
- [ ] **Logs Configuration Writer**
- [ ] **Viewer** on project

**✅ Acceptance**: All roles show as **Active** in IAM

---

## 2) Import Dashboard & Confirm Metrics (5-8 min) 📊

### Import Dashboard
1. Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
2. Click **"Import"**
3. Select file: `monitoring/paynow-webhook-dashboard.json`
4. Click **"Load"** → **"Create"**

### Verify Metrics Exist
Go to: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906

- [ ] `paynow_webhook_requests` exists
- [ ] `paynow_webhook_failures` exists
- [ ] `paynow_points_credited` exists
- [ ] `paynow_webhook_latency` exists

### Configure Dashboard
- [ ] Open imported dashboard
- [ ] Set time range to **Last 6 hours**
- [ ] Enable auto-refresh

**✅ Acceptance**: Dashboard imports without errors, charts render (will show "No data" until tests)

---

## 3) Create Notification Channel (2-3 min) 📧

1. Go to: https://console.cloud.google.com/monitoring/alerting/notifications?project=walduae-project-20250809071906
2. Click **"+ Create Channel"**
3. Choose **Email**
4. Enter your email address
5. Click **"Save"**
6. Check email for verification link
7. Click verification link

**✅ Acceptance**: Channel shows **Verified**

---

## 4) Create Five Alert Policies (8-10 min) 🚨

Go to: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906

### Alert 1: Failure Rate Spike
- [ ] Click **"+ Create Policy"**
- [ ] Name: **"PayNow Webhook - Failure Rate Spike"**
- [ ] Add condition:
  - Metric: `logging/user/paynow_webhook_failures` (numerator)
  - Metric: `logging/user/paynow_webhook_requests` (denominator)
  - Threshold: **0.01** (1%)
  - Duration: **5 minutes**
- [ ] Add notification channel
- [ ] Create

### Alert 2: No Credits for 30 Minutes
- [ ] Click **"+ Create Policy"**
- [ ] Name: **"PayNow Webhook - No Credits"**
- [ ] Add condition:
  - Metric: `logging/user/paynow_points_credited`
  - Condition: **Metric absence**
  - Duration: **30 minutes**
- [ ] Add notification channel
- [ ] Create

### Alert 3: Latency Guard
- [ ] Click **"+ Create Policy"**
- [ ] Name: **"PayNow Webhook - High Latency"**
- [ ] Add condition:
  - Metric: `logging/user/paynow_webhook_latency`
  - Aggregator: **95th percentile**
  - Threshold: **500** ms
  - Duration: **5 minutes**
- [ ] Add notification channel
- [ ] Create

### Alert 4: Endpoint Uptime
- [ ] Go to: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906
- [ ] Click **"+ Create Uptime Check"**
- [ ] Configure:
  - Protocol: **HTTPS**
  - Hostname: Your test URL
  - Path: **/api/paynow/webhook**
  - Method: **GET**
  - Expected: **401 or 405**
- [ ] Create alert for **2 consecutive failures**

### Alert 5: Signature Problems
- [ ] Create policy with logs-based condition
- [ ] Filter: `jsonPayload.component="paynow_webhook" AND jsonPayload.rejection_reason="invalid_signature"`
- [ ] Threshold: **≥ 5** entries
- [ ] Duration: **5 minutes**

**✅ Acceptance**: All 5 policies show **Enabled** with notification channel attached

---

## 5) Execute 5 Test Scenarios (10-15 min) 🧪

### Setup
- [ ] Confirm test webhook secret configured
- [ ] Confirm test product IDs in mapping
- [ ] Open Logs Explorer: https://console.cloud.google.com/logs
- [ ] Filter: `jsonPayload.component="paynow_webhook"`

### A) Happy-Path Purchase ✅
**Execute**: Run test purchase with valid product

**Verify**:
- [ ] Logs show: `webhook.received` → `credit.processed` with `idempotent=false`
- [ ] Firestore: Points credited at `users/{uid}/wallet/points`
- [ ] Metrics: requests +1, failures +0, points_credited +N
- [ ] Success page: **ZERO POSTs** in Network tab

### B) Duplicate Event 🔁
**Execute**: Resend same event_id

**Verify**:
- [ ] Logs show: `credit.skipped_duplicate` with `idempotent=true`
- [ ] Firestore: **NO second credit**
- [ ] Metrics: requests +1, failures +0, points_credited +0

### C) Replay Attack ⏰
**Execute**: Send event with timestamp > 5 minutes old

**Verify**:
- [ ] Logs show: `webhook.rejected` with reason `replay`
- [ ] Metrics: failures +1
- [ ] Firestore: NO wallet change

### D) Bad Signature 🔐
**Execute**: Send with invalid signature

**Verify**:
- [ ] Logs show: `webhook.rejected` with reason `bad_hmac`
- [ ] Alert fires (if threshold met)
- [ ] Metrics: failures +1

### E) Unmapped Product ❓
**Execute**: Send with unmapped product ID

**Verify**:
- [ ] Logs show: `webhook.rejected` with reason `unmapped_product`
- [ ] Metrics: failures +1
- [ ] Firestore: NO wallet change

**✅ Acceptance**: Each scenario produces exact expected results

---

## 6) Performance Verification (3-5 min) ⚡

1. Open dashboard
2. Find latency widget
3. Check last 60 minutes

- [ ] p95 < **250 ms** (ignore single cold start spike)

**If > 250ms**:
- Check handler returns 200 immediately
- Verify no blocking external calls
- Confirm logging is async

**✅ Acceptance**: p95 < 250 ms

---

## 7) Success Page Verification (1-2 min) 🔍

1. Keep DevTools Network tab open
2. Navigate to success page after purchase
3. Watch all network requests

- [ ] **ZERO POST requests** from client
- [ ] Only GET requests and WebSocket connections

**✅ Acceptance**: Zero POSTs from success page

---

## 8) Screenshot Documentation (5 min) 📸

Create folder: `docs/phase1/screenshots/`

Capture and save:
- [ ] `dashboard-overview.png` - Widgets with data
- [ ] `alerts-list.png` - All 5 policies enabled
- [ ] `alert-fired-signature.png` - Fired alert example
- [ ] `logs-happy-path.png` - Full event trail
- [ ] `firestore-wallet-before.png` - Pre-test balance
- [ ] `firestore-wallet-after.png` - Post-test balance
- [ ] `success-page-network.png` - Showing no POSTs

Update `PHASE_1_ACTIVATION_SUMMARY.md`:
- [ ] Activation performed by: _____________
- [ ] Date/time: _____________
- [ ] p95 latency observed: _____ ms
- [ ] Dashboard URL: [link]
- [ ] Any issues/follow-ups: _____________

**✅ Acceptance**: All screenshots captured, summary complete

---

## Final Verification ✅

**ALL must be checked**:
- [ ] IAM roles verified
- [ ] Dashboard imported and showing real data
- [ ] 5 alert policies created with notification channel
- [ ] 5 test scenarios executed with expected behavior
- [ ] p95 latency < 250 ms confirmed
- [ ] Screenshot package committed
- [ ] Summary updated

---

## Troubleshooting 🔧

### Metrics Empty?
- Confirm structured logs emitting
- Check metric names match
- Widen time range
- Re-run happy path test

### Alerts Not Firing?
- Verify channel is verified
- Check policy is enabled
- Confirm conditions match data

### Credits Missing?
- Check logs for rejection reasons
- Verify product mapping
- Check timestamp windows

### p95 High?
- Review handler for blocking work
- Ensure 200 ACK happens fast
- Consider queue approach (Phase 2)

---

## Sign-Off 📝

**Phase 1 Complete**: ☐

**Signed**: _________________________ **Date**: _____________

**Ready for Phase 2**: ☐ YES ☐ NO

---

🎉 **When all items checked, Phase 1 is COMPLETE!**

