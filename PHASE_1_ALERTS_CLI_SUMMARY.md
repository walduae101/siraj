# Phase 1 - Alerts Creation Summary

## ✅ What Was Created

1. **Uptime Check**: May have been created (check console)
2. **Alert Config Files**: Created 4 JSON reference files

## 📋 Manual Alert Creation Steps

Since the CLI requires alpha components, please create alerts manually:

### Go to: https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906

### Alert 1: High Failure Rate
- **Metric**: `paynow_webhook_failures`
- **Aggregation**: Rate
- **Threshold**: 0.01 (which is 1%)
- **Duration**: 5 minutes
- **Name**: PayNow Webhook - High Failure Rate

### Alert 2: No Credits
- **Metric**: `paynow_points_credited`
- **Type**: Metric absence
- **Duration**: 30 minutes
- **Name**: PayNow Webhook - No Credits

### Alert 3: High Latency
- **Metric**: `paynow_webhook_latency`
- **Aggregation**: 95th percentile
- **Threshold**: 500
- **Duration**: 5 minutes
- **Name**: PayNow Webhook - High Latency

### Alert 4: Endpoint Down
- **Type**: Uptime check alert
- **Check**: PayNow Webhook Health Check
- **Name**: PayNow Webhook - Endpoint Down

### Alert 5: Signature Failures
- **From**: Logs Explorer
- **Query**: `jsonPayload.component="paynow_webhook" AND jsonPayload.rejection_reason="invalid_signature"`
- **Threshold**: 5 occurrences
- **Duration**: 5 minutes
- **Name**: PayNow Webhook - Signature Failures

## 🔗 Quick Links

- [Create New Alert](https://console.cloud.google.com/monitoring/alerting/policies/create?project=walduae-project-20250809071906)
- [View All Policies](https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906)
- [Logs Explorer](https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906)
- [Uptime Checks](https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906)

## 📁 Generated Files

- `alert1-failure-rate.json`
- `alert2-no-credits.json`
- `alert3-latency.json`
- `alert5-signature.json`

These contain the configuration details for reference.

---

**All alerts should use**: PayNow Webhook Alerts (notification channel)
