# Phase 1 - Create Metrics Manually

## ⚠️ Manual Action Required

Due to PowerShell quote handling issues, please create these metrics manually in the Cloud Console:

### Go to: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906

### Metric 1: paynow_webhook_requests
1. Click **CREATE METRIC**
2. **Metric Type**: Counter
3. **Name**: `paynow_webhook_requests`
4. **Description**: Count of PayNow webhook requests received
5. **Filter**: 
   ```
   jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook received"
   ```
6. Click **CREATE METRIC**

### Metric 2: paynow_webhook_failures
**✅ Already exists**

### Metric 3: paynow_points_credited
1. Click **CREATE METRIC**
2. **Metric Type**: Counter
3. **Name**: `paynow_points_credited`
4. **Description**: Sum of points credited through PayNow webhooks
5. **Filter**: 
   ```
   jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook processed successfully" AND jsonPayload.points>0
   ```
6. **Field name**: `jsonPayload.points`
7. Click **CREATE METRIC**

### Metric 4: paynow_webhook_latency
1. Click **CREATE METRIC**
2. **Metric Type**: Distribution
3. **Name**: `paynow_webhook_latency`
4. **Description**: Processing time for PayNow webhooks in milliseconds
5. **Filter**: 
   ```
   jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0
   ```
6. **Field name**: `jsonPayload.processing_ms`
7. Click **CREATE METRIC**

---

## Dashboard Import

Once metrics are created:

1. Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
2. Click **CREATE DASHBOARD** → **Upload**
3. Select file: `monitoring/paynow-webhook-dashboard.json`
4. Click **Upload**

---

**Estimated time**: 5 minutes
