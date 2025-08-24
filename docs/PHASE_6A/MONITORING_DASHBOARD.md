# Phase 6A Queue Health Monitoring Dashboard

**Created**: 2025-01-10  
**Status**: ✅ **ACTIVE** - Queue mode monitoring

---

## Dashboard Tiles

### Queue Performance Metrics
- **Queue Lag p95**: `pubsub_subscription_oldest_unacked_message_age` (p95)
- **Worker Processing p95**: Custom metric `worker_processing_time_p95`
- **DLQ Depth**: `pubsub_subscription_dead_letter_message_count`
- **Pub/Sub Delivery Attempts**: `pubsub_subscription_delivery_attempt_count` (p95)

### Webhook Performance
- **Webhook ACK p95**: Custom metric `webhook_ack_time_p95`
- **Queue vs Sync Comparison**: Side-by-side performance metrics
- **Error Rate**: `webhook_error_rate` (queue path only)

### Business Metrics
- **Duplicate Credits**: Custom metric `duplicate_credits_count`
- **Ledger Parity**: Custom metric `ledger_parity_check`
- **Points Credited**: `points_credited_total` (queue path)

---

## Alert Policies

### Critical Alerts (Immediate Action Required)

#### DLQ Depth Alert
```yaml
displayName: "Phase 6A: DLQ Depth Critical"
condition:
  displayName: "DLQ depth > 10 for 5m"
  conditionThreshold:
    filter: 'resource.type="pubsub_subscription" AND resource.labels.subscription_id="paynow-events-sub"'
    metric: 'pubsub.googleapis.com/subscription/dead_letter_message_count'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 10
    duration: 300s
notificationChannels:
  - "critical-alerts@company.com"
```

#### Duplicate Credits Alert
```yaml
displayName: "Phase 6A: Duplicate Credits Detected"
condition:
  displayName: "Duplicate credits > 0 in 5m"
  conditionThreshold:
    filter: 'metric.type="custom.googleapis.com/duplicate_credits_count"'
    metric: 'custom.googleapis.com/duplicate_credits_count'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 0
    duration: 300s
notificationChannels:
  - "critical-alerts@company.com"
```

### Warning Alerts (Investigation Required)

#### Queue Lag Warning
```yaml
displayName: "Phase 6A: Queue Lag High"
condition:
  displayName: "Queue lag p95 > 15s for 10m"
  conditionThreshold:
    filter: 'resource.type="pubsub_subscription" AND resource.labels.subscription_id="paynow-events-sub"'
    metric: 'pubsub.googleapis.com/subscription/oldest_unacked_message_age'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 15000
    duration: 600s
    aggregations:
      - alignmentPeriod: 60s
        perSeriesAligner: ALIGN_PERCENTILE_95
notificationChannels:
  - "ops-alerts@company.com"
```

#### Worker Performance Warning
```yaml
displayName: "Phase 6A: Worker p95 High"
condition:
  displayName: "Worker p95 > 350ms for 10m"
  conditionThreshold:
    filter: 'metric.type="custom.googleapis.com/worker_processing_time_p95"'
    metric: 'custom.googleapis.com/worker_processing_time_p95'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 350
    duration: 600s
notificationChannels:
  - "ops-alerts@company.com"
```

---

## Custom Metrics

### Worker Processing Time
```typescript
// In worker service
const processingTime = Date.now() - startTime;
const metric = {
  type: 'custom.googleapis.com/worker_processing_time_p95',
  labels: {
    event_type: eventType,
    pipeline: 'queue'
  },
  value: processingTime
};
```

### Webhook ACK Time
```typescript
// In webhook handler
const ackTime = Date.now() - startTime;
const metric = {
  type: 'custom.googleapis.com/webhook_ack_time_p95',
  labels: {
    pipeline: webhookMode,
    queue_canary: isCanary
  },
  value: ackTime
};
```

### Duplicate Credits Count
```typescript
// In worker service (when duplicate detected)
const metric = {
  type: 'custom.googleapis.com/duplicate_credits_count',
  labels: {
    event_type: eventType,
    reason: 'idempotent_skip'
  },
  value: 1
};
```

---

## Dashboard URL
- **Production**: https://console.cloud.google.com/monitoring/dashboards/phase6a-queue-health
- **Staging**: https://console.cloud.google.com/monitoring/dashboards/phase6a-queue-health-staging

---

## Alert Escalation

### Critical Alerts (0-5 minutes)
1. **Immediate**: On-call engineer notification
2. **5 minutes**: Team lead escalation
3. **15 minutes**: Engineering manager escalation

### Warning Alerts (0-30 minutes)
1. **Immediate**: On-call engineer notification
2. **30 minutes**: Team lead escalation

### Rollback Triggers
- DLQ depth > 10 for 5 minutes
- Duplicate credits > 0 in any 5-minute window
- Worker p95 > 500ms for 10 minutes

---

**Last Updated**: 2025-01-10  
**Next Review**: 2025-01-17
