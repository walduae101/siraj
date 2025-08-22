# Phase 1: Monitoring Setup Guide

**Updated on: 2025-01-10**

---

## Overview

Complete guide for setting up log-based metrics, monitoring dashboard, and alert policies for the PayNow webhook system.

---

## Log-based Metrics Configuration

### Metric 1: Webhook Requests
```yaml
name: paynow_webhook_requests
type: Counter
description: Count of PayNow webhook requests received
filter: |
  jsonPayload.component="paynow_webhook"
  AND jsonPayload.message="Webhook received"
metricKind: DELTA
valueType: INT64
```

### Metric 2: Webhook Failures
```yaml
name: paynow_webhook_failures
type: Counter  
description: Count of failed PayNow webhook processing
filter: |
  jsonPayload.component="paynow_webhook"
  AND (jsonPayload.severity="ERROR" OR jsonPayload.severity="WARNING")
metricKind: DELTA
valueType: INT64
```

### Metric 3: Points Credited
```yaml
name: paynow_points_credited
type: Counter (with value extraction)
description: Sum of points credited through PayNow webhooks
filter: |
  jsonPayload.component="paynow_webhook"
  AND jsonPayload.message="Webhook processed successfully"
  AND jsonPayload.points>0
valueExtractor: jsonPayload.points
metricKind: DELTA
valueType: INT64
```

### Metric 4: Webhook Latency
```yaml
name: paynow_webhook_latency
type: Distribution
description: Processing time for PayNow webhooks in milliseconds
filter: |
  jsonPayload.component="paynow_webhook"
  AND jsonPayload.processing_ms>0
valueExtractor: jsonPayload.processing_ms
metricKind: DELTA
valueType: DISTRIBUTION
```

---

## Dashboard Configuration

### Dashboard: "PayNow Webhook Monitoring"

**Import File**: `monitoring/paynow-webhook-dashboard.json`

**Widgets**:
1. **Request Rate** - Line chart showing webhook requests/minute
2. **Failure Rate** - Line chart showing failure percentage  
3. **Points Credited** - Stacked area chart by product
4. **Processing Latency** - Heatmap showing p50, p95, p99
5. **Recent Errors** - Log panel filtered for severity=ERROR
6. **Idempotent Skips** - Scorecard for duplicate detection

### Import Instructions
1. Go to [Monitoring Dashboards](https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906)
2. Click **"Create Dashboard"** → **⋮ menu** → **"Import JSON"**
3. Upload dashboard file from repository
4. Save as "PayNow Webhook Monitoring"

---

## Alert Policies

### 6 Alert Policies Required

#### 1. High Failure Rate
- **Name**: PayNow Webhook - High Failure Rate
- **Condition**: failures/requests ratio > 1% for 5 minutes
- **Severity**: Error
- **Notification**: Email

#### 2. Processing Failures  
- **Name**: PayNow Webhook - Processing Failures
- **Condition**: Any failures > 1 for 1 minute
- **Severity**: Error
- **Notification**: Email

#### 3. No Requests (Downtime)
- **Name**: PayNow Webhook - No Requests
- **Condition**: No requests for 15 minutes
- **Severity**: Warning
- **Notification**: Email

#### 4. High Processing Latency
- **Name**: PayNow Webhook - High Latency
- **Condition**: p95 > 5000ms for 5 minutes
- **Severity**: Warning  
- **Notification**: Email

#### 5. Points Processing Errors
- **Name**: PayNow Webhook - Points Processing Failures
- **Condition**: No points credited for 30 minutes
- **Severity**: Critical
- **Notification**: Email

#### 6. Endpoint Health
- **Name**: PayNow Webhook - Endpoint Health
- **Type**: Uptime check
- **URL**: webhook endpoint (GET method)
- **Expected**: 401 or 405 status
- **Alert**: 2 consecutive failures

---

## Notification Channel

### Email Channel: "PayNow Webhook Alerts"
- **Email**: walduae101@gmail.com
- **Display Name**: PayNow Webhook Alerts
- **Description**: Critical alerts for PayNow webhook processing
- **Status**: Must be Verified

**Apply to all 6 alert policies**

---

## Manual Setup Commands

### Using Cloud Console
Follow the step-by-step instructions in [Phase 1 Runbook](./RUNBOOK.md) for UI-based setup.

### Using gcloud CLI (Alternative)
```bash
# Create metrics
gcloud logging metrics create paynow_webhook_requests \
  --description="Count of PayNow webhook requests received" \
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook received"'

# Import dashboard
gcloud monitoring dashboards create --config-from-file=monitoring/paynow-webhook-dashboard.json

# Create uptime check
gcloud monitoring uptime create paynow-webhook-health \
  --display-name="PayNow Webhook Health Check" \
  --resource-type=URL \
  --monitored-url="https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook"
```

---

## Verification

### Metrics Validation
1. Go to [Logs-based Metrics](https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906)
2. Verify all 4 metrics exist and are configured correctly
3. Run test webhook to populate metrics
4. Check dashboard shows data within 2-3 minutes

### Alert Validation  
1. Go to [Alert Policies](https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906)
2. Verify all 6 policies are Enabled
3. Verify all have email notification channel attached
4. Test one alert by triggering failure condition

---

## Monitoring URLs

- **Dashboard**: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
- **Alert Policies**: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
- **Metrics**: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906
- **Logs Explorer**: https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906

---

**Success Criteria**: Dashboard populated, 6 alerts active, email notifications verified, p95 <250ms
