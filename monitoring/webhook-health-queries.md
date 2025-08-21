# PayNow Webhook Health Monitoring Queries

## Cloud Logging Queries

### 1. Webhook Request Summary (Last 24 Hours)
```
resource.labels.service_name="siraj"
httpRequest.requestUrl:"/api/paynow/webhook"
timestamp>="2024-12-20T00:00:00Z"
```

### 2. Failed Webhook Requests (401 Errors)
```
resource.labels.service_name="siraj"
httpRequest.requestUrl:"/api/paynow/webhook"
httpRequest.status=401
severity>=WARNING
```

### 3. Successful Webhook Processing
```
resource.labels.service_name="siraj"
jsonPayload.message:"webhook" AND jsonPayload.message:"processed"
```

### 4. Webhook Signature Verification Failures
```
resource.labels.service_name="siraj"
jsonPayload.message:"Invalid signature" OR jsonPayload.message:"Signature"
severity>=WARNING
```

### 5. Webhook Processing Errors
```
resource.labels.service_name="siraj"
jsonPayload.message:"webhook" AND severity>=ERROR
```

### 6. Credit Operations
```
resource.labels.service_name="siraj"
jsonPayload.message:"credited" OR jsonPayload.message:"Credit"
```

### 7. User Mapping Failures
```
resource.labels.service_name="siraj"
jsonPayload.message:"no_user_mapping" OR jsonPayload.message:"User not found"
```

## Metrics to Create

### 1. Webhook Request Rate
- **Name:** `paynow_webhook_requests`
- **Filter:** `resource.labels.service_name="siraj" AND httpRequest.requestUrl:"/api/paynow/webhook"`
- **Labels:** `httpRequest.status`

### 2. Webhook Success Rate
- **Name:** `paynow_webhook_success_rate`
- **Filter:** `resource.labels.service_name="siraj" AND httpRequest.requestUrl:"/api/paynow/webhook" AND httpRequest.status=200`

### 3. Points Credited
- **Name:** `points_credited_total`
- **Filter:** `resource.labels.service_name="siraj" AND jsonPayload.credited>0`
- **Value Extractor:** `jsonPayload.credited`

## Alert Policies

### 1. High Webhook Failure Rate
- **Condition:** Webhook 401 rate > 10 requests per minute for 5 minutes
- **Notification:** Email + PagerDuty
- **Documentation:** Check PayNow webhook secret configuration

### 2. No Webhooks Received
- **Condition:** No webhook requests for 30 minutes during business hours
- **Notification:** Email
- **Documentation:** Check PayNow dashboard webhook configuration

### 3. Processing Errors Spike
- **Condition:** Error rate > 5% of webhook requests
- **Notification:** Email + Slack
- **Documentation:** Check Cloud Run logs for specific error messages

## Dashboard Configuration

Create a custom dashboard with:

1. **Webhook Request Rate** (time series)
   - Success (200) vs Failure (401, 500) stacked

2. **Points Credited** (time series)
   - Sum of points credited per hour

3. **User Mapping Success Rate** (scorecard)
   - Percentage of webhooks successfully mapped to users

4. **Processing Latency** (heatmap)
   - Time between webhook receipt and processing completion

5. **Error Log Stream** (log panel)
   - Live view of webhook errors

## Usage

1. Import these queries into Cloud Logging saved queries
2. Create log-based metrics using the filters above
3. Set up alert policies in Cloud Monitoring
4. Build the dashboard for operational visibility

## Troubleshooting Guide

### Symptom: All webhooks returning 401
**Check:**
- PayNow webhook secret in Google Secret Manager matches dashboard
- Header names are lowercase (paynow-signature, paynow-timestamp)
- Timestamp is not stale (> 5 minutes old)

### Symptom: Webhooks succeed but no points credited
**Check:**
- Product IDs in webhook match configured products
- User mapping is successful (check paynowCustomers collection)
- No duplicate event IDs (check webhookEvents collection)

### Symptom: Intermittent failures
**Check:**
- Cloud Run service health
- Firestore quotas and limits
- Network connectivity between PayNow and Cloud Run
