# Phase 1 - Detailed Alert Configuration Guide

## 🚨 Alert 1: High Failure Rate (>1%)

From your current screen:

1. **Configure trigger** section:
   - Alert trigger: **Any time series violates**
   - Threshold position: **Above threshold**
   - Threshold value: **1** 
   - Click **ADVANCED OPTIONS**:
     - Retest window: **5 minutes**

2. Click **NEXT**

3. **Configure notifications**:
   - Notification channels: Select **PayNow Webhook Alerts**
   - ✅ Check **Use notification channel**
   - Incident autoclose duration: **30 min**

4. **Policy details**:
   - Alert policy name: **PayNow Webhook - High Failure Rate**
   - Documentation (optional):
     ```
     This alert fires when webhook failure rate exceeds 1% for 5 minutes.
     Check logs for errors and verify PayNow service status.
     ```

5. Click **CREATE POLICY**

---

## 🚨 Alert 2: No Credits for 30 min

1. Go back to policies page and click **+ CREATE POLICY**

2. **Select a metric**:
   - Search: `paynow_points_credited`
   - Select **logging/user/paynow_points_credited**
   - Click **NEXT**

3. **Configure trigger**:
   - Condition types: Select **Metric absence**
   - Alert trigger: **Any time series violates**
   - Trigger absence time: **30 minutes**
   - Click **NEXT**

4. **Configure notifications**:
   - Notification channels: Select **PayNow Webhook Alerts**
   - Incident autoclose: **60 min**

5. **Policy details**:
   - Name: **PayNow Webhook - No Credits**
   - Documentation:
     ```
     No points have been credited for 30 minutes.
     Check webhook endpoint health and PayNow service status.
     ```

6. Click **CREATE POLICY**

---

## 🚨 Alert 3: High Latency (p95 > 500ms)

1. Create new policy

2. **Select a metric**:
   - Search: `paynow_webhook_latency`
   - Select **logging/user/paynow_webhook_latency**

3. **Add filters**: Leave empty

4. **Transform data**:
   - Within each time series:
     - Rolling window: **1 min**
     - Rolling window function: **percentile 95**
   - Click **NEXT**

5. **Configure trigger**:
   - Threshold: **500**
   - For: **5 minutes**

6. **Notifications & name**:
   - Channel: **PayNow Webhook Alerts**
   - Name: **PayNow Webhook - High Latency**

---

## 🚨 Alert 4: Uptime Check Failure

1. Go to: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906

2. If "PayNow Webhook Health Check" doesn't exist:
   - Click **+ CREATE UPTIME CHECK**
   - Protocol: **HTTPS**
   - Resource type: **URL**
   - Hostname: **siraj.life**
   - Path: **/api/paynow/webhook**
   - Check frequency: **5 minutes**
   - Regions: Select at least 3
   - **Response Validation**:
     - Response code: **Custom**
     - Acceptable codes: **401,405**
   - **Alert & notification**:
     - Create an alert: **Yes**
     - Notification: **PayNow Webhook Alerts**
   - Name: **PayNow Webhook Health Check**
   - Click **CREATE**

---

## 🚨 Alert 5: Signature Verification Failures

1. Create new policy

2. **Select a metric** → Click **Query Editor** mode

3. Enter MQL query:
   ```
   fetch cloud_run_revision
   | filter resource.service_name == 'siraj'
   | { t_0:
       metric logging.googleapis.com/user/paynow_webhook_failures
       | filter metric.rejection_reason == 'invalid_signature'
       | align rate(1m)
       | group_by [], sum(val())
   }
   | value val(0)
   ```

4. **Configure trigger**:
   - Threshold: **5**
   - For: **5 minutes**

5. **Name**: **PayNow Webhook - Signature Failures**

---

## 📝 Alternative for Alert 5 (if MQL doesn't work)

Create a simple log-based alert:

1. Go to **Logs Explorer**
2. Enter query:
   ```
   jsonPayload.component="paynow_webhook" 
   jsonPayload.rejection_reason="invalid_signature"
   ```
3. Click **Create alert** from the query results
4. Configure as above

---

## 🎯 Dashboard Import Alternative

If the JSON import fails, create the dashboard manually:

1. Go to Monitoring → Dashboards
2. Click **+ CREATE DASHBOARD**
3. Name: **PayNow Webhook Monitoring**
4. Add widgets manually:
   - **Widget 1**: Line chart for `paynow_webhook_requests` (rate)
   - **Widget 2**: Line chart for `paynow_webhook_failures` (rate)
   - **Widget 3**: Line chart for `paynow_points_credited` (sum)
   - **Widget 4**: Line chart for `paynow_webhook_latency` (95th percentile)

---

## ✅ Quick Verification

After creating all alerts:
1. Go to Alert Policies page
2. Verify all 5 show **Enabled**
3. Each should have the email notification channel attached

**Tip**: Try the simplified dashboard at `monitoring/paynow-webhook-dashboard-simple.json`
