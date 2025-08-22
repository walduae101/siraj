# Phase 1: Observability & Guardrails - Complete Runbook

**Updated on: 2025-01-10**

---

## Overview

This runbook provides complete step-by-step instructions for implementing Phase 1 of the PayNow webhook security hardening initiative. Phase 1 focuses on observability, monitoring, and security guardrails.

**Environment**: TEST ONLY  
**Time Required**: 35-45 minutes  
**Prerequisites**: PayNow test store access, test webhook secret, admin access to Google Cloud

---

## Architecture

```
PayNow → Webhook → Process → Credit Points → Firestore
                ↓
         Structured Logs → Metrics → Dashboard + Alerts → Email
```

---

## 0) Pre-Flight Verification ⚡

**CRITICAL**: Complete these checks before proceeding

- [ ] Using PayNow **test store** (not production)
- [ ] Using **test webhook secret** starting with `whsec_test_`
- [ ] Webhook URL points to **test** Cloud Run service
- [ ] DevTools Network tab open for success page verification
- [ ] 45 minutes available for uninterrupted work

**⚠️ STOP if any item is unchecked - resolve first**

---

## 1) IAM Role Verification (5 min) 🔐

### Cloud Run Service Account
**Check at**: https://console.cloud.google.com/iam-admin/iam?project=walduae-project-20250809071906

Required roles:
- [ ] **Logs Writer**
- [ ] **Monitoring Metric Writer**
- [ ] **Firestore User**
- [ ] **Cloud Trace Agent** (optional)

### Your User Account
Required roles:
- [ ] **Monitoring Admin**
- [ ] **Logs Configuration Writer**
- [ ] **Project Viewer**

**✅ Acceptance**: All roles show as **Active** in IAM console

---

## 2) Metrics Creation (5-8 min) 📊

### Create 4 Log-based Metrics
**Go to**: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906

#### Metric 1: paynow_webhook_requests
- **Name**: `paynow_webhook_requests`
- **Type**: Counter
- **Description**: Count of PayNow webhook requests received
- **Filter**: 
  ```
  jsonPayload.component="paynow_webhook"
  jsonPayload.message="Webhook received"
  ```

#### Metric 2: paynow_webhook_failures
- **Name**: `paynow_webhook_failures`
- **Type**: Counter
- **Description**: Count of failed PayNow webhook processing
- **Filter**: 
  ```
  jsonPayload.component="paynow_webhook"
  (jsonPayload.severity="ERROR" OR jsonPayload.severity="WARNING")
  ```

#### Metric 3: paynow_points_credited
- **Name**: `paynow_points_credited`
- **Type**: Counter (with value extraction)
- **Description**: Sum of points credited through PayNow webhooks
- **Filter**: 
  ```
  jsonPayload.component="paynow_webhook"
  jsonPayload.message="Webhook processed successfully"
  jsonPayload.points>0
  ```
- **Field name**: `jsonPayload.points`

#### Metric 4: paynow_webhook_latency
- **Name**: `paynow_webhook_latency`
- **Type**: Distribution
- **Description**: Processing time for PayNow webhooks in milliseconds
- **Filter**: 
  ```
  jsonPayload.component="paynow_webhook"
  jsonPayload.processing_ms>0
  ```
- **Field name**: `jsonPayload.processing_ms`

**✅ Acceptance**: All 4 metrics created and visible in metrics list

---

## 3) Dashboard Import (2-3 min) 📈

### Import Dashboard
1. **Go to**: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
2. Click **"Create Dashboard"** → **⋮ menu** → **"Import JSON"** (NOT Grafana)
3. Upload: `monitoring/paynow-webhook-dashboard.json`
4. **Name**: "PayNow Webhook Monitoring"
5. Set time range to **Last 6 hours**
6. Enable auto-refresh

**✅ Acceptance**: Dashboard imports without errors, widgets render (will show "No data" until tests)

---

## 4) Email Notification Channel (2-3 min) 📧

1. **Go to**: https://console.cloud.google.com/monitoring/alerting/notifications?project=walduae-project-20250809071906
2. Click **"+ Create Channel"**
3. Select **Email**
4. Configuration:
   - **Display Name**: `PayNow Webhook Alerts`
   - **Email Address**: `walduae101@gmail.com`
   - **Description**: `Critical alerts for PayNow webhook processing`
5. Click **"Save"**
6. Check email for verification link and verify

**✅ Acceptance**: Channel shows **Verified** status

---

## 5) Alert Policies Creation (10-15 min) 🚨

**Go to**: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906

### Alert 1: High Failure Rate
- **Display Name**: `PayNow Webhook - High Failure Rate`
- **Condition**: Metric threshold
- **Metric**: Create ratio of `paynow_webhook_failures` / `paynow_webhook_requests`
- **Threshold**: Above `0.01` (1%)
- **Duration**: `5 minutes`
- **Notification**: PayNow Webhook Alerts
- **Documentation**: 
  ```
  PayNow webhook failure rate exceeded 1% over 5 minutes.
  Check logs: jsonPayload.component="paynow_webhook" AND severity="ERROR"
  ```

### Alert 2: Processing Failures
- **Display Name**: `PayNow Webhook - Processing Failures`  
- **Condition**: Metric threshold
- **Metric**: `paynow_webhook_failures`
- **Threshold**: Above `1`
- **Duration**: `1 minute`
- **Notification**: PayNow Webhook Alerts

### Alert 3: No Requests (Downtime)
- **Display Name**: `PayNow Webhook - No Requests`
- **Condition**: Metric absence  
- **Metric**: `paynow_webhook_requests`
- **Duration**: `15 minutes`
- **Notification**: PayNow Webhook Alerts

### Alert 4: High Processing Latency
- **Display Name**: `PayNow Webhook - High Latency`
- **Condition**: Metric threshold
- **Metric**: `paynow_webhook_latency`
- **Aggregation**: 95th percentile
- **Threshold**: Above `5000` ms
- **Duration**: `5 minutes`
- **Notification**: PayNow Webhook Alerts

### Alert 5: Points Processing Errors
- **Display Name**: `PayNow Webhook - Points Processing Failures`
- **Condition**: Metric absence
- **Metric**: `paynow_points_credited`  
- **Duration**: `30 minutes`
- **Notification**: PayNow Webhook Alerts

### Alert 6: Endpoint Uptime
- **Type**: Uptime Check
- **Display Name**: `PayNow Webhook - Endpoint Health`
- **URL**: `https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook`
- **Method**: GET
- **Expected Status**: 401 or 405
- **Alert**: 2 consecutive failures

**✅ Acceptance**: All 6 policies show **Enabled** with email notification

---

## 6) Test Execution (10-15 min) 🧪

### Environment Setup
```bash
# Set test environment variables (TEST ONLY)
export PAYNOW_WEBHOOK_SECRET="whsec_test_your_secret"
export WEBHOOK_URL="https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook"
```

### Test A: Valid Purchase ✅
**Execute**: Send valid webhook with mapped product

**Expected**:
- HTTP Status: 200 OK
- Processing: <250ms
- Logs: `"Webhook processed successfully"` with `idempotent=false`
- Firestore: Points credited at `users/{uid}/wallet/points`
- Metrics: requests +1, points_credited +N

### Test B: Duplicate Event 🔁
**Execute**: Send same event_id twice

**Expected**:
- HTTP Status: 200 OK  
- Processing: <50ms (second request)
- Logs: `"Event already processed, skipping"` with `idempotent=true`
- Firestore: NO additional credit
- Metrics: requests +1, points_credited +0

### Test C: Bad Signature 🔐
**Execute**: Send with invalid signature

**Expected**:
- HTTP Status: 401 Unauthorized
- Processing: <50ms
- Logs: `"Webhook rejected - invalid signature"`
- Metrics: failures +1
- Alert: Signature failures alert may fire

### Test D: Stale Timestamp ⏰
**Execute**: Send with timestamp >5 minutes old

**Expected**:
- HTTP Status: 401 Unauthorized  
- Processing: <50ms
- Logs: `"Webhook rejected - invalid timestamp"`
- Metrics: failures +1

### Test E: Missing Headers ❓
**Execute**: Send without signature/timestamp headers

**Expected**:
- HTTP Status: 401 Unauthorized
- Processing: <50ms  
- Logs: `"Webhook rejected - invalid signature"`
- Metrics: failures +1

**✅ Acceptance**: Each scenario produces exact expected results

---

## 7) Performance Verification (3-5 min) ⚡

1. Open monitoring dashboard
2. Navigate to latency widget  
3. Set to 95th percentile view
4. Check last 60 minutes

**Target**: p95 < **250ms** (ignore single cold-start spike)

**If above target**:
- Verify handler returns 200 immediately
- Check for blocking external calls  
- Confirm structured logging is non-blocking

**✅ Acceptance**: p95 latency < 250ms sustained

---

## 8) Security Validation (1-2 min) 🔍

### Success Page Network Check
1. Open Chrome DevTools (F12) → Network tab
2. Navigate to checkout success page
3. Monitor all network requests during page load

**Requirements**:
- [ ] **ZERO POST requests** from client
- [ ] Only GET requests and WebSocket connections
- [ ] No writes to wallet or ledger from browser

**✅ Acceptance**: Zero client-side write operations

---

## 9) Evidence Collection (5 min) 📸

### Screenshot Package
Create folder: `docs/phase1/screenshots/`

**Required Screenshots**:
- [ ] `01-dashboard-overview.png` - Dashboard with populated widgets
- [ ] `02-alerts-list.png` - All 6 policies enabled  
- [ ] `03-alert-fired.png` - Example of fired alert
- [ ] `04-logs-structured.png` - Structured log entries with required fields
- [ ] `05-firestore-ttl.png` - TTL policy showing "Serving"
- [ ] `06-wallet-before-after.png` - Points credited correctly
- [ ] `07-success-page-network.png` - Zero POST requests

### Documentation Update
Update completion template with:
- Date/time of activation
- p95 latency observed  
- Links to dashboard and logs
- Any issues encountered and resolutions

**✅ Acceptance**: All evidence captured and documented

---

## 10) Final Verification Checklist ✅

**ALL must be checked for completion**:

### Core Infrastructure
- [ ] 4 log-based metrics created and ingesting data
- [ ] Dashboard imported and showing real metrics  
- [ ] 6 alert policies created with email notifications
- [ ] Email channel verified and receiving test alerts

### Security Validation  
- [ ] No client-side point crediting detected
- [ ] Success page performs zero write operations
- [ ] Firestore rules prevent client wallet writes
- [ ] TTL policy active on webhookEvents

### Performance & Testing
- [ ] All 5 test scenarios executed successfully
- [ ] p95 latency confirmed <250ms
- [ ] Idempotency verified (duplicate detection)
- [ ] Security boundaries confirmed (invalid requests rejected)

### Documentation & Evidence
- [ ] Complete screenshot package captured
- [ ] Activation summary documented
- [ ] Links verified and accessible
- [ ] Troubleshooting steps validated

---

## Troubleshooting 🔧

### Metrics Not Appearing
1. Wait 2-3 minutes for log ingestion
2. Verify structured logs format in Cloud Logging
3. Check metric filter queries match log structure
4. Re-run test scenarios to generate data

### Alerts Not Firing  
1. Verify notification channel is verified
2. Check alert policy is enabled
3. Confirm threshold conditions match test data
4. Send multiple failure requests to exceed thresholds

### High Latency
1. Check for cold starts (first request after deploy)
2. Verify no blocking operations in webhook handler
3. Confirm structured logging happens after response
4. Consider Phase 2 queue architecture

---

## Sign-Off 📝

**Phase 1 Status**: ☐ COMPLETE

**Completed by**: _________________________  
**Date**: _________________________  
**p95 Latency**: _________ ms  
**Issues Encountered**: _________________________  

**Ready for Phase 2**: ☐ YES ☐ NO

---

🎉 **Phase 1 Complete** - Your webhook system now has production-grade monitoring and security!
