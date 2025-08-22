# Phase 1 - Alert Policy Field Values (Copy & Paste Ready)

## 🚨 Alert 1: High Failure Rate

### Step 1 - Configure Trigger
- **Condition type**: Threshold
- **Alert trigger**: Any time series violates
- **Threshold position**: Above threshold
- **Threshold value**: `1`
- **Advanced Options** (expand):
  - **Retest window**: `5 minutes`

### Step 2 - Notifications
- **Notification channels**: Select `PayNow Webhook Alerts`
- **Incident autoclose duration**: `30 min`

### Step 3 - Policy Details
- **Alert policy name**: `PayNow Webhook - High Failure Rate`
- **Documentation**:
```
This alert fires when webhook failure rate exceeds 1% for 5 minutes.
Check logs for errors and verify PayNow service status.
Dashboard: https://console.cloud.google.com/monitoring/dashboards
```

---

## 🚨 Alert 2: No Credits for 30 min

### Create New Policy
1. Go to policies page: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
2. Click **+ CREATE POLICY**

### Step 1 - Select Metric
- Search: `paynow_points_credited`
- Select: **logging/user/paynow_points_credited**

### Step 2 - Configure Trigger
- **Condition type**: Metric absence
- **Alert trigger**: Any time series violates
- **Trigger absence time**: `30 minutes`

### Step 3 - Notifications
- **Notification channels**: Select `PayNow Webhook Alerts`
- **Incident autoclose duration**: `60 min`

### Step 4 - Policy Details
- **Alert policy name**: `PayNow Webhook - No Credits`
- **Documentation**:
```
No points have been credited for 30 minutes.
Check webhook endpoint health and PayNow service status.
Verify Cloud Run service is running and receiving traffic.
```

---

## 🚨 Alert 3: High Latency (p95 > 500ms)

### Create New Policy

### Step 1 - Select Metric
- Search: `paynow_webhook_latency`
- Select: **logging/user/paynow_webhook_latency**

### Step 2 - Transform Data
- **Within each time series**:
  - **Rolling window**: `1 min`
  - **Rolling window function**: `percentile 95`

### Step 3 - Configure Trigger
- **Condition type**: Threshold
- **Alert trigger**: Any time series violates
- **Threshold position**: Above threshold
- **Threshold value**: `500`
- **Advanced Options**:
  - **For**: `5 minutes`

### Step 4 - Notifications
- **Notification channels**: Select `PayNow Webhook Alerts`
- **Incident autoclose duration**: `30 min`

### Step 5 - Policy Details
- **Alert policy name**: `PayNow Webhook - High Latency`
- **Documentation**:
```
Webhook processing latency p95 exceeds 500ms for 5 minutes.
Check Cloud Run CPU/memory usage and concurrent request limits.
Review webhook processing code for performance bottlenecks.
```

---

## 🚨 Alert 4: Endpoint Down (Uptime Check)

### Option A - If Uptime Check Already Exists
1. Go to: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906
2. Look for "PayNow Webhook Health Check"
3. If exists, click on it → **ALERTING** → **CREATE ALERT POLICY**

### Option B - Create New Uptime Check
1. Go to uptime checks page
2. Click **+ CREATE UPTIME CHECK**

### Uptime Check Configuration
- **Protocol**: `HTTPS`
- **Resource type**: `URL`
- **Hostname**: `siraj.life`
- **Path**: `/api/paynow/webhook`
- **Port**: `443`
- **Check frequency**: `5 minutes`
- **Timeout**: `10 seconds`
- **Regions**: Select at least 3 (e.g., Virginia, Iowa, Oregon)

### Response Validation
- **Response Content Match Type**: `DOES_NOT_CONTAIN`
- **Content**: Leave empty
- **Response Status Codes**: `CUSTOM`
- **Acceptable Status Codes**: `401,405`

### Alert Configuration
- **Create an alert**: `Yes`
- **Alert name**: `PayNow Webhook - Endpoint Down`
- **Notification channel**: `PayNow Webhook Alerts`

---

## 🚨 Alert 5: Signature Verification Failures

### Create New Policy

### Step 1 - Build Custom Query
1. Click **+ CREATE POLICY**
2. Select **Logs Explorer** option (if available) OR use basic metric

### Option A - Using Log Query
- In logs query box:
```
jsonPayload.component="paynow_webhook" 
jsonPayload.rejection_reason="invalid_signature"
```

### Option B - Using Basic Metric
1. Select **logging/user/paynow_webhook_failures**
2. Add filter:
   - Click **+ ADD FILTER**
   - **Label**: `rejection_reason`
   - **Value**: `invalid_signature`

### Step 2 - Configure Trigger
- **Condition type**: Threshold
- **Alert trigger**: Any time series violates
- **Threshold position**: Above threshold
- **Threshold value**: `5`
- **Advanced Options**:
  - **For**: `5 minutes`

### Step 3 - Notifications
- **Notification channels**: Select `PayNow Webhook Alerts`
- **Incident autoclose duration**: `30 min`

### Step 4 - Policy Details
- **Alert policy name**: `PayNow Webhook - Signature Failures`
- **Documentation**:
```
Multiple webhook signature verification failures detected.
Possible causes: key rotation, malicious requests, or PayNow changes.
Verify webhook secret configuration and check with PayNow support.
```

---

## 📋 Quick Checklist After Creating All Alerts

1. Go to: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
2. Verify you have 5 policies:
   - ✅ PayNow Webhook - High Failure Rate
   - ✅ PayNow Webhook - No Credits
   - ✅ PayNow Webhook - High Latency
   - ✅ PayNow Webhook - Endpoint Down
   - ✅ PayNow Webhook - Signature Failures
3. Each should show:
   - Status: **Enabled**
   - Notification: **PayNow Webhook Alerts**

---

## 🎯 Common Values for All Alerts

- **Notification Channel**: `PayNow Webhook Alerts`
- **Severity**: `No severity` (default)
- **Project**: `walduae-project-20250809071906`

---

## ⚠️ Important Notes

1. **No data warning**: The charts may show "No data" - this is normal in TEST environment
2. **Incident autoclose**: Set appropriately (30-60 min) to avoid notification spam
3. **Documentation**: Optional but recommended for operational clarity

---

**Time estimate**: 20-30 minutes to create all 5 alerts
