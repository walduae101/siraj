# Cloud Monitoring Setup for PayNow Webhooks

## Overview

This document provides the configuration for log-based metrics, alerts, and dashboards to monitor the PayNow webhook integration.

## Log-Based Metrics

### 1. PayNow Webhook Requests

Create a counter metric for all webhook requests received.

```yaml
name: paynow_webhook_requests
description: Count of PayNow webhook requests received
filter: |
  jsonPayload.component="paynow_webhook"
  jsonPayload.message="Webhook received"
valueExtractor: ""
metricKind: DELTA
valueType: INT64
labels:
  - key: event_type
    valueExtractor: jsonPayload.event_type
```

### 2. PayNow Webhook Failures

Create a counter metric for failed webhook processing.

```yaml
name: paynow_webhook_failures
description: Count of failed PayNow webhook processing
filter: |
  jsonPayload.component="paynow_webhook"
  (jsonPayload.severity="ERROR" OR jsonPayload.severity="WARNING")
valueExtractor: ""
metricKind: DELTA
valueType: INT64
labels:
  - key: rejection_reason
    valueExtractor: jsonPayload.rejection_reason
  - key: event_type
    valueExtractor: jsonPayload.event_type
```

### 3. PayNow Points Credited

Create a counter metric for total points credited.

```yaml
name: paynow_points_credited
description: Sum of points credited through PayNow webhooks
filter: |
  jsonPayload.component="paynow_webhook"
  jsonPayload.message="Webhook processed successfully"
  jsonPayload.points>0
valueExtractor: jsonPayload.points
metricKind: DELTA
valueType: INT64
labels:
  - key: product_id
    valueExtractor: jsonPayload.product_id
```

### 4. Webhook Processing Latency

Create a distribution metric for processing time.

```yaml
name: paynow_webhook_latency
description: Processing time for PayNow webhooks in milliseconds
filter: |
  jsonPayload.component="paynow_webhook"
  jsonPayload.processing_ms>0
valueExtractor: jsonPayload.processing_ms
metricKind: DELTA
valueType: DISTRIBUTION
```

## Creating Metrics via gcloud CLI

```bash
# Set project
gcloud config set project walduae-project-20250809071906

# Create webhook requests metric
gcloud logging metrics create paynow_webhook_requests \
  --description="Count of PayNow webhook requests received" \
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook received"' \
  --value-extractor="" \
  --metric-kind=DELTA

# Create webhook failures metric
gcloud logging metrics create paynow_webhook_failures \
  --description="Count of failed PayNow webhook processing" \
  --log-filter='jsonPayload.component="paynow_webhook" AND (jsonPayload.severity="ERROR" OR jsonPayload.severity="WARNING")' \
  --value-extractor="" \
  --metric-kind=DELTA

# Create points credited metric
gcloud logging metrics create paynow_points_credited \
  --description="Sum of points credited through PayNow webhooks" \
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook processed successfully" AND jsonPayload.points>0' \
  --value-extractor="jsonPayload.points" \
  --metric-kind=DELTA

# Create latency metric
gcloud logging metrics create paynow_webhook_latency \
  --description="Processing time for PayNow webhooks in milliseconds" \
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' \
  --value-extractor="jsonPayload.processing_ms" \
  --metric-kind=DELTA \
  --metric-descriptor-value-type=DISTRIBUTION
```

## Alerts Configuration

### 1. High Failure Rate Alert

```yaml
displayName: PayNow Webhook High Failure Rate
conditions:
  - displayName: Failure rate > 1%
    conditionThreshold:
      filter: |
        metric.type="logging.googleapis.com/user/paynow_webhook_failures"
        resource.type="cloud_run_revision"
      comparison: COMPARISON_GT
      thresholdValue: 0.01
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
notificationChannels:
  - projects/walduae-project/notificationChannels/YOUR_CHANNEL_ID
```

### 2. No Credits Alert

```yaml
displayName: PayNow No Credits for 30 Minutes
conditions:
  - displayName: Zero credits
    conditionAbsent:
      filter: |
        metric.type="logging.googleapis.com/user/paynow_points_credited"
        resource.type="cloud_run_revision"
      duration: 1800s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_SUM
notificationChannels:
  - projects/walduae-project/notificationChannels/YOUR_CHANNEL_ID
```

### 3. High Latency Alert

```yaml
displayName: PayNow Webhook High Latency
conditions:
  - displayName: p95 latency > 5s
    conditionThreshold:
      filter: |
        metric.type="logging.googleapis.com/user/paynow_webhook_latency"
        resource.type="cloud_run_revision"
      comparison: COMPARISON_GT
      thresholdValue: 5000
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_PERCENTILE_95
notificationChannels:
  - projects/walduae-project/notificationChannels/YOUR_CHANNEL_ID
```

## Dashboard Configuration

Create a monitoring dashboard with the following widgets:

1. **Request Rate** - Line chart showing webhook requests/minute
2. **Failure Rate** - Line chart showing failure percentage
3. **Points Credited** - Stacked area chart by product
4. **Processing Latency** - Heatmap showing p50, p95, p99
5. **Recent Errors** - Log panel filtered for severity=ERROR

### Dashboard JSON Template

```json
{
  "displayName": "PayNow Webhook Monitoring",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "xPos": 0,
        "yPos": 0,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Webhook Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"logging.googleapis.com/user/paynow_webhook_requests\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}
```

## Uptime Check Configuration

Create an uptime check for the webhook endpoint:

```bash
gcloud monitoring uptime create \
  --display-name="PayNow Webhook Health" \
  --resource-type="URL" \
  --monitored-url="https://siraj.life/api/paynow/webhook" \
  --http-check-request-method="GET" \
  --http-check-expected-response-status-codes="405,401" \
  --period="300"
```

## Testing the Monitoring

1. Send test webhooks to verify metrics are populating
2. Simulate failures to test alerts
3. Check dashboard updates in real-time
4. Verify uptime check is green

## Maintenance

- Review metrics monthly for accuracy
- Adjust alert thresholds based on observed patterns
- Archive old log entries per retention policy
- Update dashboard as new metrics are added

