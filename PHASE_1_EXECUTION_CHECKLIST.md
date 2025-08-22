# Phase 1 Execution Checklist - Test Environment

**Start Time**: _______________  
**Environment**: TEST ONLY

---

## 1) Pre-Flight Go/No-Go ✈️

- [ ] Cloud Run service = TEST service with TEST webhook secret
- [ ] Firestore TTL = **Serving** on `webhookEvents.expiresAt`
- [ ] Three tabs open:
  - [ ] Monitoring Dashboards
  - [ ] Logs Explorer (structured view)
  - [ ] Firestore Data viewer

**GO**: ☐ (check only when all above are true)

---

## 2) Dashboard & Metrics 📊

- [ ] Dashboard imported from `monitoring/paynow-webhook-dashboard.json`
- [ ] Metrics verified:
  - [ ] `paynow_webhook_requests`
  - [ ] `paynow_webhook_failures`
  - [ ] `paynow_points_credited`
  - [ ] `paynow_webhook_latency` (distribution)
- [ ] Dashboard time = "Last 6 hours" + auto-refresh ON

**Acceptance**: Dashboard loads, charts ready (will populate after tests)

---

## 3) Alerts Setup 🚨

- [ ] Notification channel created (email)
- [ ] Channel verified ✓
- [ ] Alert 1: Failure rate > 1% / 5 min
- [ ] Alert 2: No credits / 30 min
- [ ] Alert 3: p95 > 500ms / 5 min
- [ ] Alert 4: Uptime check (GET /api/paynow/webhook)
- [ ] Alert 5: Bad signatures ≥5 / 5 min
- [ ] All alerts show **Enabled** with channel

---

## 4) Test Execution 🧪

**DevTools Network tab**: OPEN on success page

### Scenario A - Happy Path ✅
- [ ] Logs: received → processed (idempotent=false)
- [ ] Firestore: Points credited at `users/{uid}/wallet/points`
- [ ] Metrics: requests +1, failures +0, points +N
- [ ] Success page: **ZERO POSTs**

### Scenario B - Duplicate 🔁
- [ ] Logs: skipped_duplicate (idempotent=true)
- [ ] Firestore: NO additional credit
- [ ] Metrics: requests +1 only

### Scenario C - Replay ⏰
- [ ] Logs: rejected (reason=replay)
- [ ] Metrics: failures +1
- [ ] Firestore: NO credit

### Scenario D - Bad Signature 🔐
- [ ] Logs: rejected (reason=bad_hmac)
- [ ] Alert triggered (if threshold met)
- [ ] Metrics: failures +1

### Scenario E - Unmapped Product ❓
- [ ] Logs: rejected (reason=unmapped_product)
- [ ] Metrics: failures +1
- [ ] Firestore: NO credit

---

## 5) Performance ⚡

- [ ] Latency widget shows p95 data
- [ ] **p95 < 250ms** ✅ (ignore single cold start)
- [ ] Actual p95: _______ ms

---

## 6) Documentation 📸

Screenshots captured in `docs/phase1/screenshots/`:
- [ ] `dashboard-overview.png`
- [ ] `alerts-list.png`
- [ ] `alert-fired.png`
- [ ] `logs-happy-path.png`
- [ ] `firestore-before-after.png`
- [ ] `success-zero-posts.png`

Updated in `PHASE_1_ACTIVATION_FINAL.md`:
- [ ] Performed by: _______________
- [ ] Date/time: _______________
- [ ] Dashboard URL: _______________
- [ ] p95 observed: _______ ms
- [ ] Issues/notes: _______________

---

## Definition of Done ✅

ALL must be checked:
- [ ] IAM verified
- [ ] Dashboard shows real data
- [ ] 5 alerts created and enabled
- [ ] 5 tests passed exactly as expected
- [ ] p95 < 250ms confirmed
- [ ] Screenshots committed
- [ ] Final doc updated

---

## Sign-Off 📝

**Phase 1 Complete**: ☐

**Completed by**: _______________ **Time**: _______________

**Ready for Phase 2**: ☐ YES

---

**Next**: See `PHASE_2_QUEUE_WORKER_DESIGN.md`

