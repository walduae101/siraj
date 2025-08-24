# Phase 6A: Queue Mode Cutover Runbook

**Updated on: 2025-01-10**  
**Status**: 🔄 **IN PROGRESS** - Queue mode cutover for throughput & resilience

---

## Overview

Phase 6A implements queue mode cutover to improve webhook performance and system resilience by moving from synchronous to asynchronous processing using Google Cloud Pub/Sub.

### Benefits
- **Webhook ACK**: <50ms (from 100-500ms)
- **Throughput**: Handle traffic spikes without blocking
- **Resilience**: Automatic retries and dead letter queue
- **Scalability**: Independent worker scaling

---

## Pre-Cutover Checklist

### ✅ Infrastructure Verification
- [ ] Pub/Sub topics: `paynow-events` and `paynow-events-dlq` exist
- [ ] Service accounts: `pubsub-publisher`, `pubsub-push`, `paynow-worker` configured
- [ ] Worker service: `/api/tasks/paynow/process` endpoint accessible
- [ ] Push subscription: OIDC auth, ordering enabled, DLQ attached
- [ ] IAM permissions: Publisher can publish, worker can read Firestore

### ✅ Configuration Validation
- [ ] `webhookMode` feature flag available in config
- [ ] `webhookQueueCanaryRatio` feature flag available in config
- [ ] Secret Manager config updated with new fields
- [ ] Environment variables documented

### ✅ Monitoring Setup
- [ ] Queue depth metrics configured
- [ ] Worker processing metrics configured
- [ ] DLQ monitoring alerts configured
- [ ] Dashboard tiles for queue metrics added

---

## Cutover Process

### Step 1: Staging Validation

#### 1.1 Enable Queue Mode in Staging
```bash
# Update staging config in Secret Manager
gcloud secrets versions add siraj-config --data-file=staging-config.json

# Config should include:
{
  "features": {
    "webhookMode": "queue",
    "webhookQueueCanaryRatio": 0
  }
}
```

#### 1.2 Run Staging Smoke Tests
```bash
# Run Phase 6A test scenarios
pnpm tsx scripts/test-phase6a-scenarios.ts

# Expected results:
# ✅ Configuration Validation
# ✅ Canary Routing Logic  
# ✅ Pub/Sub Publishing Performance
# ✅ Worker Endpoint Health
# ✅ Canary Ratio Scenarios
```

#### 1.3 Validate Performance Metrics
```bash
# Check webhook ACK times (should be <50ms p95)
gcloud logging read "jsonPayload.component=paynow_webhook AND jsonPayload.status=queued" \
  --limit=100 --format="table(timestamp,jsonPayload.processing_ms)"

# Check worker processing times (should be <250ms p95)
gcloud logging read "jsonPayload.component=paynow_worker AND jsonPayload.message=Worker processed event successfully" \
  --limit=100 --format="table(timestamp,jsonPayload.processing_ms)"
```

#### 1.4 Verify Idempotency
```bash
# Send duplicate webhook and verify no double credit
# Check Firestore for single ledger entry
```

### Step 2: Production Canary (10% Traffic)

#### 2.1 Enable 10% Canary
```bash
# Update production config in Secret Manager
gcloud secrets versions add siraj-config --data-file=prod-canary-10.json

# Config should include:
{
  "features": {
    "webhookMode": "sync",
    "webhookQueueCanaryRatio": 0.10
  }
}
```

#### 2.2 Monitor Canary Metrics (First 2 Hours)
```bash
# Check canary routing logs
gcloud logging read "jsonPayload.queue_canary=true" \
  --limit=50 --format="table(timestamp,jsonPayload.event_id,jsonPayload.webhook_mode,jsonPayload.canary_ratio)"

# Monitor webhook ACK performance
gcloud logging read "jsonPayload.component=paynow_webhook" \
  --limit=100 --format="table(timestamp,jsonPayload.processing_ms,jsonPayload.queue_canary)"

# Check worker processing
gcloud logging read "jsonPayload.component=paynow_worker AND jsonPayload.pipeline=queue" \
  --limit=100 --format="table(timestamp,jsonPayload.processing_ms,jsonPayload.ordering_key)"
```

#### 2.3 Success Criteria (2 Hours)
- [ ] Webhook ACK p95 < 50ms (queue mode)
- [ ] Worker p95 < 250ms
- [ ] DLQ count = 0
- [ ] Duplicate credits = 0
- [ ] Ledger parity confirmed

### Step 3: Ramp to 50% (24 Hours)

#### 3.1 Update to 50% Canary
```bash
# Update production config
gcloud secrets versions add siraj-config --data-file=prod-canary-50.json

# Config should include:
{
  "features": {
    "webhookMode": "sync", 
    "webhookQueueCanaryRatio": 0.50
  }
}
```

#### 3.2 Monitor for 24 Hours
- [ ] Continue monitoring all metrics
- [ ] Check for any performance degradation
- [ ] Verify no credit loss or duplicates
- [ ] Monitor DLQ for any issues

### Step 4: Full Cutover (100%)

#### 4.1 Enable Full Queue Mode
```bash
# Update production config
gcloud secrets versions add siraj-config --data-file=prod-queue-100.json

# Config should include:
{
  "features": {
    "webhookMode": "queue",
    "webhookQueueCanaryRatio": 0
  }
}
```

#### 4.2 Post-Cutover Validation
```bash
# Verify all traffic going to queue
gcloud logging read "jsonPayload.component=paynow_webhook AND jsonPayload.status=queued" \
  --limit=50 --format="table(timestamp,jsonPayload.processing_ms)"

# Check worker processing
gcloud logging read "jsonPayload.component=paynow_worker AND jsonPayload.pipeline=queue" \
  --limit=50 --format="table(timestamp,jsonPayload.processing_ms)"
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

#### Queue Performance
- **Webhook ACK p95**: Target <50ms
- **Worker p95**: Target <250ms
- **Queue Depth**: Alert if >1000 messages
- **Message Age**: Alert if >5 minutes

#### Reliability Metrics
- **DLQ Depth**: Alert if >10 messages
- **Duplicate Credits**: Alert if >0 in 5 minutes
- **Worker Error Rate**: Alert if >5% in 5 minutes

#### Business Metrics
- **Points Credited**: Should match sync mode
- **User Experience**: No impact on point crediting
- **Revenue**: No impact on payment processing

### Alert Policies

#### Critical Alerts (P1)
1. **DLQ Depth > 10 for 5m**
   - Condition: `num_undelivered_messages > 10` in DLQ subscription
   - Notification: PagerDuty + Slack
   - Action: Investigate poison messages

2. **Worker p95 > 350ms for 10m**
   - Condition: Worker processing p95 > 350ms
   - Notification: PagerDuty + Slack
   - Action: Check worker scaling and performance

3. **Duplicate Credits > 0 in 5m**
   - Condition: Any duplicate credit events
   - Notification: PagerDuty + Slack
   - Action: Investigate idempotency issues

#### Warning Alerts (P2)
1. **Queue Depth > 1000 for 5m**
   - Condition: Main queue backlog > 1000 messages
   - Notification: Slack
   - Action: Monitor worker scaling

2. **No Worker Processing for 10m**
   - Condition: No worker processing events
   - Notification: Slack
   - Action: Check worker service health

---

## Rollback Procedures

### Immediate Rollback (Emergency)
```bash
# Switch back to sync mode immediately
gcloud secrets versions add siraj-config --data-file=prod-sync-rollback.json

# Config should include:
{
  "features": {
    "webhookMode": "sync",
    "webhookQueueCanaryRatio": 0
  }
}
```

### Verification Steps
1. **Send test webhook** and verify direct processing
2. **Check logs** for sync mode processing
3. **Verify points credited** correctly
4. **Confirm no new Pub/Sub messages** being published

### Queue Cleanup (If Needed)
```bash
# Process remaining messages in queue
gcloud pubsub subscriptions pull paynow-events-sub \
  --auto-ack --limit=100

# Check DLQ for failed messages
gcloud pubsub subscriptions pull paynow-events-dlq-sub \
  --auto-ack --limit=50
```

### Rollback Triggers
- **DLQ > 10 messages**: Immediate rollback
- **Worker p95 > 350ms**: Rollback if sustained
- **Duplicate credits > 0**: Immediate rollback
- **Any credit loss**: Immediate rollback

---

## Post-Cutover Monitoring

### Week 1: Intensive Monitoring
- [ ] Monitor all metrics every 2 hours
- [ ] Check DLQ every 4 hours
- [ ] Verify ledger parity daily
- [ ] Review performance metrics daily

### Week 2-4: Standard Monitoring
- [ ] Daily performance reviews
- [ ] Weekly DLQ analysis
- [ ] Monthly ledger reconciliation
- [ ] Quarterly performance optimization

### Success Metrics
- [ ] Webhook ACK p95 < 50ms sustained
- [ ] Worker p95 < 250ms sustained
- [ ] Zero credit loss or duplicates
- [ ] DLQ remains empty
- [ ] User experience unchanged

---

## Troubleshooting

### Common Issues

#### High Webhook ACK Times
1. **Check Pub/Sub publishing**: Verify publisher service health
2. **Review network latency**: Check Cloud Run to Pub/Sub connectivity
3. **Monitor resource usage**: Check CPU/memory on webhook service

#### Worker Processing Delays
1. **Check worker scaling**: Verify min/max instances configured
2. **Review Firestore performance**: Check for slow queries
3. **Monitor concurrency**: Check if worker is overwhelmed

#### DLQ Messages
1. **Analyze message content**: Check for malformed events
2. **Review worker logs**: Look for processing errors
3. **Check Firestore permissions**: Verify worker service account access

#### Duplicate Credits
1. **Verify idempotency logic**: Check webhookEvents collection
2. **Review transaction handling**: Ensure atomic operations
3. **Check ordering key**: Verify serial processing per user

### Debug Commands
```bash
# Check queue depth
gcloud pubsub subscriptions describe paynow-events-sub \
  --format="value(numUndeliveredMessages)"

# View recent worker logs
gcloud logging read "jsonPayload.component=paynow_worker" \
  --limit=20 --format="table(timestamp,jsonPayload.message,jsonPayload.processing_ms)"

# Check DLQ messages
gcloud pubsub subscriptions pull paynow-events-dlq-sub \
  --limit=5 --format="table(message.data,message.attributes)"
```

---

## Success Criteria

### Performance Targets
- ✅ Webhook response time: <50ms p95
- ✅ Worker processing: <250ms p95
- ✅ Zero dropped events under load
- ✅ Identical ledger results

### Reliability Targets
- ✅ Idempotent processing
- ✅ Duplicate protection
- ✅ Dead letter queue handling
- ✅ Graceful error handling

### Business Targets
- ✅ Zero credit loss
- ✅ Zero revenue impact
- ✅ Unchanged user experience
- ✅ Improved system resilience

---

## Contact Information

### On-Call Rotation
- **Primary**: Senior Dev Lead
- **Secondary**: DevOps Engineer
- **Escalation**: CTO

### Communication Channels
- **Slack**: #paynow-webhook-alerts
- **PagerDuty**: PayNow Webhook Queue
- **Email**: walduae101@gmail.com

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-10  
**Next Review**: 2025-01-17
