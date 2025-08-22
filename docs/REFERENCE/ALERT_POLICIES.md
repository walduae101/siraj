# Alert Policies Reference

**Updated on: 2025-01-10**

---

## Complete Alert Policy Catalog

This document provides the authoritative reference for all PayNow webhook alert policies, their exact thresholds, evaluation windows, and notification configurations.

---

## Alert Policy Specifications

### 1. High Failure Rate
- **Display Name**: `PayNow Webhook - High Failure Rate`
- **Type**: Metric-based threshold (ratio)
- **Condition**: `paynow_webhook_failures / paynow_webhook_requests > 0.01`
- **Evaluation Window**: 5 minutes
- **Threshold**: 1% (0.01)
- **Severity**: Error
- **Notification**: PayNow Webhook Alerts (email)
- **Purpose**: Detect systematic processing failures
- **Runbook**: [High Failure Rate Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#high-failure-rate-alert-1)

### 2. Processing Failures (Immediate)
- **Display Name**: `PayNow Webhook - Processing Failures`
- **Type**: Log-based threshold
- **Condition**: Any processing errors > 1 in 1 minute
- **Evaluation Window**: 1 minute
- **Threshold**: 1 occurrence
- **Severity**: Error
- **Notification**: PayNow Webhook Alerts (email)
- **Purpose**: Immediate notification of any processing failure
- **Runbook**: [Processing Failures Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#processing-failures)

### 3. No Requests (Downtime Detection)
- **Display Name**: `PayNow Webhook - No Requests`
- **Type**: Metric absence
- **Condition**: No webhook requests for 15 minutes
- **Evaluation Window**: 15 minutes
- **Threshold**: 0 requests
- **Severity**: Warning
- **Notification**: PayNow Webhook Alerts (email)  
- **Purpose**: Detect endpoint downtime or PayNow delivery issues
- **Runbook**: [No Credits Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#no-credits-alert-30-minutes)

### 4. High Processing Latency
- **Display Name**: `PayNow Webhook - High Latency`
- **Type**: Metric-based threshold (distribution)
- **Condition**: p95 processing time > 5000ms for 5 minutes
- **Evaluation Window**: 5 minutes  
- **Threshold**: 5000ms (5 seconds)
- **Aggregation**: 95th percentile
- **Severity**: Warning
- **Notification**: PayNow Webhook Alerts (email)
- **Purpose**: Detect performance degradation
- **Runbook**: [High Latency Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#high-latency-alert-p95--5s)

### 5. Points Processing Errors
- **Display Name**: `PayNow Webhook - Points Processing Failures`
- **Type**: Metric absence
- **Condition**: No points credited for 30 minutes
- **Evaluation Window**: 30 minutes
- **Threshold**: 0 points credited
- **Severity**: Critical
- **Notification**: PayNow Webhook Alerts (email)
- **Purpose**: Detect business logic failures affecting revenue
- **Runbook**: [Points Processing Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#no-credits-alert-30-minutes)

### 6. Endpoint Health Check
- **Display Name**: `PayNow Webhook - Endpoint Health`
- **Type**: Uptime check
- **URL**: `https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook`
- **Method**: GET
- **Expected Status**: 401 Unauthorized OR 405 Method Not Allowed
- **Check Frequency**: 5 minutes
- **Alert Condition**: 2 consecutive failures
- **Severity**: Critical
- **Notification**: PayNow Webhook Alerts (email)
- **Purpose**: Ensure webhook endpoint accessibility
- **Runbook**: [Endpoint Down Response](../RUNBOOKS/WEBHOOK_RUNBOOK.md#endpoint-down-alert)

---

## Notification Configuration

### Email Channel: "PayNow Webhook Alerts"
- **Channel Type**: Email
- **Email Address**: walduae101@gmail.com
- **Display Name**: PayNow Webhook Alerts
- **Verification Status**: ✅ Verified
- **Applied To**: All 6 alert policies

### Email Content Format
```
Alert Policy: [POLICY_NAME]
Condition: [THRESHOLD_DETAILS]
Documentation: [RUNBOOK_LINK]
Time: [TIMESTAMP]
Project: walduae-project-20250809071906
```

---

## Alert Thresholds Summary

| Alert | Metric Source | Threshold | Window | Notification |
|-------|---------------|-----------|--------|--------------|
| Failure Rate | paynow_webhook_failures/requests | >1% | 5min | Email |
| Processing Errors | Log-based (ERROR severity) | >1 | 1min | Email |
| No Requests | paynow_webhook_requests | absent | 15min | Email |
| High Latency | paynow_webhook_latency p95 | >5000ms | 5min | Email |
| Points Errors | paynow_points_credited | absent | 30min | Email |
| Endpoint Health | Uptime check (GET) | 2 failures | consecutive | Email |

---

## Testing Alert Policies

### Trigger Test Alerts

#### Test Processing Failures Alert
```bash
# Send webhook with bad signature (should trigger alert)
curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
  -H "Content-Type: application/json" \
  -H "paynow-signature: invalid_test_signature" \
  -H "paynow-timestamp: $(date +%s)000" \
  -d '{"id": "test-alert-trigger", "event_type": "ON_ORDER_COMPLETED"}'
```

#### Test High Failure Rate Alert  
```bash
# Send multiple bad requests to exceed 1% threshold
for i in {1..10}; do
  curl -X POST https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook \
    -H "paynow-signature: invalid" \
    -H "paynow-timestamp: $(date +%s)000" \
    -d "{\"id\":\"test-$i\"}"
done
```

#### Verify Email Notifications
- Check walduae101@gmail.com inbox within 2-3 minutes
- Verify alert content includes policy name and condition
- Confirm runbook links are accessible

---

## Alert Policy Management

### Creating New Policies
1. Follow [Monitoring Setup Guide](../PHASE_1/MONITORING_SETUP.md)
2. Use consistent naming: `PayNow Webhook - [Purpose]`
3. Apply email notification channel
4. Include documentation with runbook links
5. Test policy with synthetic failure

### Modifying Existing Policies
1. Update threshold values based on observed patterns
2. Adjust evaluation windows for operational needs
3. Document changes in policy description
4. Test modifications before applying

### Disabling Policies
⚠️ **Requires approval** - alerts are critical for system health
1. Temporarily disable during maintenance windows only
2. Document reason and duration  
3. Re-enable immediately after maintenance
4. Verify functionality with test alert

---

## Alert History & Analytics

### Policy Performance Metrics
- **False Positive Rate**: <5% target
- **Mean Time to Alert**: <2 minutes target  
- **Alert Resolution Time**: <15 minutes target
- **Escalation Rate**: <10% of total alerts

### Monthly Review Process
1. Analyze alert frequency and patterns
2. Adjust thresholds based on operational experience
3. Update runbook procedures based on incident learnings
4. Validate notification channels and escalation paths

---

## Console Links

- **Create Policy**: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906
- **View All Policies**: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
- **Notification Channels**: https://console.cloud.google.com/monitoring/alerting/notifications?project=walduae-project-20250809071906
- **Uptime Checks**: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906

---

**Maintained by**: Platform Engineering Team  
**Review Schedule**: Monthly  
**Last Updated**: January 10, 2025
