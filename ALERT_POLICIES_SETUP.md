# 🚨 **Alert Policies Setup Guide**

## Overview

Create these 5 alert policies in [Google Cloud Console - Monitoring](https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906)

---

## Alert Policy 1: High Failure Rate

**Display Name**: `PayNow Webhook - High Failure Rate`

**Condition**:
- **Condition Type**: Metric threshold
- **Target**: 
  - **Resource Type**: Cloud Run revision
  - **Metric**: `logging.googleapis.com/user/paynow_webhook_failures` (ratio with requests)
- **Configuration**:
  - **Condition**: is above
  - **Threshold**: `0.01` (1%)
  - **For**: `5 minutes`
- **Filter**: 
  ```
  resource.labels.service_name="siraj" AND
  resource.labels.location="us-central1"
  ```

**Documentation**:
```
PayNow webhook failure rate exceeded 1% over 5 minutes.
Check logs for error patterns and webhook processing issues.

Logs query: jsonPayload.component="paynow_webhook" AND severity="ERROR"
```

---

## Alert Policy 2: Any Processing Failure

**Display Name**: `PayNow Webhook - Processing Failures`

**Condition**:
- **Condition Type**: Metric threshold
- **Target**:
  - **Resource Type**: Cloud Run revision  
  - **Metric**: `logging.googleapis.com/user/paynow_webhook_failures`
- **Configuration**:
  - **Condition**: is above
  - **Threshold**: `1`
  - **For**: `1 minute`
- **Filter**:
  ```
  resource.labels.service_name="siraj" AND
  resource.labels.location="us-central1"
  ```

**Documentation**:
```
PayNow webhook processing failures detected.
Immediate signal for any webhook processing errors.

Check: jsonPayload.component="paynow_webhook" AND severity="ERROR"
```

---

## Alert Policy 3: No Webhook Requests

**Display Name**: `PayNow Webhook - No Requests (Downtime)`

**Condition**:
- **Condition Type**: Metric absence
- **Target**:
  - **Resource Type**: Cloud Run revision
  - **Metric**: `logging.googleapis.com/user/paynow_webhook_requests`
- **Configuration**:
  - **Condition**: is absent
  - **For**: `15 minutes`
- **Filter**:
  ```
  resource.labels.service_name="siraj" AND
  resource.labels.location="us-central1"  
  ```

**Documentation**:
```
No PayNow webhook requests received for 15 minutes.
This may indicate:
- PayNow service issues
- Network connectivity problems  
- Webhook endpoint problems

Check service health and PayNow dashboard.
```

---

## Alert Policy 4: High Processing Latency

**Display Name**: `PayNow Webhook - High Processing Latency`

**Condition**:
- **Condition Type**: Metric threshold
- **Target**:
  - **Resource Type**: Cloud Run revision
  - **Metric**: `logging.googleapis.com/user/paynow_webhook_latency`
- **Configuration**:
  - **Condition**: is above
  - **Threshold**: `5000` (5 seconds)
  - **Aggregation**: 95th percentile
  - **For**: `5 minutes`
- **Filter**:
  ```
  resource.labels.service_name="siraj" AND
  resource.labels.location="us-central1"
  ```

**Documentation**:
```
PayNow webhook p95 processing latency exceeded 5 seconds.
This may indicate:
- Database performance issues
- External service delays
- Resource constraints

Check: processing_ms field in webhook logs
Query: jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>5000
```

---

## Alert Policy 5: Points Processing Errors

**Display Name**: `PayNow Webhook - Points Processing Failures`

**Condition**:
- **Condition Type**: Metric absence
- **Target**:
  - **Resource Type**: Cloud Run revision  
  - **Metric**: `logging.googleapis.com/user/paynow_points_credited`
- **Configuration**:
  - **Condition**: is absent
  - **For**: `30 minutes`
- **Filter**:
  ```
  resource.labels.service_name="siraj" AND
  resource.labels.location="us-central1"
  ```

**Documentation**:
```
No points credited for 30 minutes despite webhook activity.
This may indicate:
- Points service failures
- Product mapping issues
- User resolution problems

Check: jsonPayload.component="paynow_webhook" AND jsonPayload.points>0
```

---

## Notification Channel Setup

### Email Channel: "PayNow Webhook Alerts"

1. Go to [Notification Channels](https://console.cloud.google.com/monitoring/alerting/notifications?project=walduae-project-20250809071906)
2. Click **"Create Notification Channel"**
3. Select **Email**
4. Configuration:
   - **Display Name**: `PayNow Webhook Alerts`
   - **Email Address**: `walduae101@gmail.com`
   - **Description**: `Critical alerts for PayNow webhook processing`

### Apply to All Policies

Make sure all 5 alert policies use the "PayNow Webhook Alerts" notification channel.

---

## Verification Checklist

After creating all policies:

- [ ] 5 alert policies created and enabled
- [ ] All policies target the correct Cloud Run service (`siraj`)
- [ ] All policies use the "PayNow Webhook Alerts" notification channel
- [ ] Test alert by triggering a webhook error (bad signature)
- [ ] Verify email notification is received

---

## Alert Policy URLs

After creation, you should have 5 policies at:
`https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906`

**Policy Names to Create:**
1. PayNow Webhook - High Failure Rate
2. PayNow Webhook - Processing Failures  
3. PayNow Webhook - No Requests (Downtime)
4. PayNow Webhook - High Processing Latency
5. PayNow Webhook - Points Processing Failures

---

## Testing Alerts

### Test Failure Rate Alert
Send a webhook with bad signature:
```bash
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "paynow-signature: invalid" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{"id":"test-alert"}'
```

### Test Latency Alert  
Not easily testable without load, but can be simulated by adding artificial delay in code.

### Test Points Alert
Send valid webhook with unmapped product ID to prevent points crediting.

---

🚨 **All alerts should point to: walduae101@gmail.com**
