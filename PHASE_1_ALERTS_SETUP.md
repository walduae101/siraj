# Phase 1 - Alerts Setup Guide

## Step 1: Create Notification Channel

1. Go to: https://console.cloud.google.com/monitoring/alerting/notifications?project=walduae-project-20250809071906
2. Click **+ CREATE CHANNEL**
3. **Type**: Email
4. **Display name**: PayNow Webhook Alerts
5. **Email**: your-test-email@example.com
6. Click **SAVE**
7. Check email and click verification link
8. Confirm shows **Verified**

---

## Step 2: Create 5 Alert Policies

### Alert 1: Failure Rate > 1%

1. Go to: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906
2. **Condition**:
   - Click **SELECT A METRIC**
   - Search: `paynow_webhook_failures`
   - Select **logging/user/paynow_webhook_failures**
   - **Aggregator**: rate
   - **Period**: 1 min
3. Click **ADD ANOTHER METRIC**:
   - Search: `paynow_webhook_requests`
   - Select **logging/user/paynow_webhook_requests**
   - **Aggregator**: rate
   - **Period**: 1 min
4. **Configure trigger**:
   - **Condition type**: Ratio
   - **Numerator**: failures
   - **Denominator**: requests
   - **Threshold**: 0.01
   - **For**: 5 minutes
5. **Notification**: Select your channel
6. **Name**: PayNow Webhook - High Failure Rate
7. **CREATE POLICY**

### Alert 2: No Credits for 30 min

1. Create new policy
2. **Condition**:
   - Metric: `logging/user/paynow_points_credited`
   - **Condition type**: Metric absence
   - **Duration**: 30 minutes
3. **Notification**: Select your channel
4. **Name**: PayNow Webhook - No Credits
5. **CREATE POLICY**

### Alert 3: p95 Latency > 500ms

1. Create new policy
2. **Condition**:
   - Metric: `logging/user/paynow_webhook_latency`
   - **Aggregator**: 95th percentile
   - **Period**: 1 min
   - **Threshold**: 500
   - **For**: 5 minutes
3. **Notification**: Select your channel
4. **Name**: PayNow Webhook - High Latency
5. **CREATE POLICY**

### Alert 4: Uptime Check

1. Go to: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906
2. Check if "PayNow Webhook Health Check" already exists
3. If not, click **+ CREATE UPTIME CHECK**:
   - **Protocol**: HTTPS
   - **Hostname**: siraj.life
   - **Path**: /api/paynow/webhook
   - **Port**: 443
   - **Check frequency**: 5 minutes
4. **Response Validation**:
   - **Expected response codes**: 401, 405
5. **Alert**: Toggle ON
6. **Notification**: Select your channel
7. **CREATE**

### Alert 5: Signature Problems

1. Create new policy
2. Click **SELECT A METRIC** → **Logs-based metrics**
3. **Build a query**:
   ```
   jsonPayload.component="paynow_webhook" 
   AND jsonPayload.rejection_reason="invalid_signature"
   ```
4. **Configure**:
   - **Aggregator**: count
   - **Threshold**: 5
   - **For**: 5 minutes
5. **Notification**: Select your channel
6. **Name**: PayNow Webhook - Signature Failures
7. **CREATE POLICY**

---

## Verification

After creating all alerts:

1. Go to: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
2. Verify all 5 policies show:
   - ✅ Enabled
   - ✅ Your notification channel attached

---

**Estimated time**: 10-15 minutes
