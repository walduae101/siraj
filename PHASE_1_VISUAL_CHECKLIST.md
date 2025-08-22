# Phase 1 Activation - Visual Checklist

## 🔐 Step 0: Prechecks
- [ ] Cloud Run service account has **Logs Writer**
- [ ] Cloud Run service account has **Monitoring Metric Writer**  
- [ ] Your user has **Monitoring Admin**
- [ ] Your user has **Logs Configuration Writer**

---

## 📊 Step 1: Metrics & Dashboard
- [ ] Dashboard imported from `monitoring/paynow-webhook-dashboard.json`
- [ ] Metric exists: `paynow_webhook_requests`
- [ ] Metric exists: `paynow_webhook_failures`
- [ ] Metric exists: `paynow_points_credited`
- [ ] Metric exists: `paynow_webhook_latency`
- [ ] Dashboard opens without errors (charts show "No data" - OK for now)

---

## 🚨 Step 2: Create 5 Alerts
- [ ] **Alert 1**: Failure rate > 1% for 5 min
- [ ] **Alert 2**: No credits for 30 min  
- [ ] **Alert 3**: p95 latency > 5000ms for 5 min
- [ ] **Alert 4**: Endpoint uptime check (GET expects 401/405)
- [ ] **Alert 5**: Signature failures ≥ 5 in 5 min
- [ ] All alerts have notification channel attached

---

## 🧪 Step 3: Run Test Scenarios

### Environment Ready:
- [ ] `PAYNOW_WEBHOOK_SECRET` = TEST secret (not prod!)
- [ ] Test product IDs identified
- [ ] Logs Explorer open with query
- [ ] Dashboard open in browser
- [ ] Firestore console open

### Execute Tests:
- [ ] **A. Happy Path** → Points credited, logs show success
- [ ] **B. Duplicate** → No extra credit, logs show "idempotent"  
- [ ] **C. Stale Timestamp** → Rejected, failure metric +1
- [ ] **D. Bad Signature** → Rejected, alert fires
- [ ] **E. Unmapped Product** → Rejected, no wallet change

---

## 📈 Step 4: Performance Check
- [ ] Dashboard shows latency chart with data
- [ ] p95 latency < 250ms ✅
- [ ] If > 250ms, investigation notes: ________________

---

## 🔍 Step 5: Success Page Verification
- [ ] DevTools Network tab open
- [ ] Navigate to `/checkout/success`
- [ ] Zero POST/PUT/PATCH requests observed
- [ ] Only read operations (GET, WebSocket) present

---

## 📸 Step 6: Documentation
- [ ] Screenshot: Dashboard with populated data
- [ ] Screenshot: Alert policies list (all 5)
- [ ] Screenshot: At least one fired alert
- [ ] Screenshot: Happy path logs with full trail
- [ ] Screenshot: Firestore wallet before/after
- [ ] Update `PHASE_1_COMPLETION_REPORT.md`

---

## ✅ Final Acceptance
- [ ] No `userPoints` in code
- [ ] No `checkout.complete` 
- [ ] No client wallet writes
- [ ] Success page = zero writes
- [ ] All metrics have data
- [ ] All alerts created
- [ ] All tests passed as expected
- [ ] p95 < 250ms confirmed
- [ ] Documentation complete

---

## 🎯 Phase 1 Status

**COMPLETE** when all boxes checked ✅

**Time taken**: _____ minutes  
**Issues encountered**: _________________________________  
**Notes for Phase 2**: _________________________________

---

Sign-off: _________________ Date: _________________

