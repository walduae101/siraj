# 🚀 Phase 2: Queue + Worker Implementation Guide

## Overview

Phase 2 transforms the webhook from synchronous processing to an asynchronous queue-based architecture using Google Cloud Pub/Sub.

---

## Architecture

```
PayNow → Webhook (Fast ACK) → Pub/Sub → Worker → Firestore
                   ↓                      ↓
              webhookEvents           Dead Letter Queue
              (status: queued)        (failed events)
```

---

## Implementation Details

### 1. **Feature Flag**
- **Location**: `src/server/config.ts`
- **Flag**: `webhookMode: "sync" | "queue"`
- **Default**: `"sync"` (safe rollback)
- **Environment**: `WEBHOOK_MODE=queue`

### 2. **Webhook Handler Updates**
- **File**: `src/app/api/paynow/webhook/route.ts`
- **Queue Mode**: 
  - Validates signature/timestamp
  - Writes `webhookEvents` with `status: "queued"`
  - Publishes to Pub/Sub with ordering key
  - Returns 200 immediately (<50ms target)
- **Sync Mode**: Existing behavior (fallback)

### 3. **Pub/Sub Publisher**
- **File**: `src/server/services/pubsubPublisher.ts`
- **Features**:
  - Ordering key = uid (ensures serial processing per user)
  - Minimal PII in messages
  - Health check capability

### 4. **Worker Service**
- **File**: `src/app/api/tasks/paynow/process/route.ts`
- **Endpoint**: `/api/tasks/paynow/process`
- **Features**:
  - OIDC authentication verification
  - Idempotent processing with transactions
  - Terminal vs transient error handling
  - Supports orders and subscriptions

### 5. **Enhanced Points Service**
- **File**: `src/server/services/points.ts`
- **Addition**: `creditPointsInTransaction()` method
- **Features**:
  - Transaction-safe credit operations
  - Maintains idempotency across queue boundary

---

## Cloud Infrastructure Setup

### Required Resources

1. **Pub/Sub Topics**:
   - `paynow-events` (main queue)
   - `paynow-events-dlq` (dead letter queue)

2. **Service Accounts**:
   - `pubsub-publisher@siraj` - Webhook publishes events
   - `pubsub-push@siraj` - Push subscription authentication
   - `paynow-worker@siraj` - Worker service permissions

3. **Cloud Run Services**:
   - `siraj` (existing webhook) - Publisher role
   - `paynow-worker` (new) - Worker with private access

4. **Pub/Sub Subscription**:
   - `paynow-events-sub` (push to worker)
   - OIDC authentication
   - Ordering enabled
   - Dead letter policy (5 attempts)

### Setup Commands

See `docs/PHASE_2_CLOUD_SETUP.md` for complete setup commands.

---

## Message Contract

### Message Structure
```json
{
  "eventId": "evt_abc123",
  "eventType": "order.paid", 
  "timestamp": "2025-01-10T12:00:00Z",
  "data": {
    "order": {
      "id": "order_123",
      "customerId": "cust_456",
      "items": [...]
    }
  }
}
```

### Message Attributes
```
event_id: "evt_abc123"
event_type: "order.paid"
uid: "firebase_uid_123"
ordering_key: "firebase_uid_123"
```

**Ordering Key**: Ensures events for the same user are processed serially.

---

## Deployment Process

### 1. Pre-deployment
```bash
# Install dependencies
npm install

# Verify types compile
npx tsc --noEmit

# Run linting
npx biome check .
```

### 2. Infrastructure Setup
```bash
# Create Pub/Sub topics
gcloud pubsub topics create paynow-events
gcloud pubsub topics create paynow-events-dlq

# Deploy worker service
gcloud run deploy paynow-worker --source .
```

### 3. Enable Queue Mode
```bash
# Update webhook service
gcloud run services update siraj \
  --update-env-vars="WEBHOOK_MODE=queue"
```

### 4. Verification
- Send test webhook → verify queued
- Check worker logs → verify processed
- Verify points credited
- Check DLQ is empty

---

## Monitoring Enhancements

### New Metrics
- `paynow_queue_published` - Events published to queue
- `paynow_worker_processed` - Successfully processed
- `paynow_worker_failures` - Processing failures
- `paynow_worker_latency` - Worker processing time
- `paynow_queue_publish_latency` - Time to publish

### New Alerts
- Queue backlog growing
- Worker failures
- High worker latency
- Dead letter queue messages
- No processing activity

### Dashboard Updates
- Queue depth chart
- Worker processing rate
- DLQ status
- Latency comparison (webhook vs worker)

---

## Error Handling Strategy

### Transient Errors (5xx response)
- Database timeouts
- Network issues
- Resource constraints
- **Action**: Pub/Sub automatic retry with backoff

### Terminal Errors (2xx response)  
- Unknown product IDs
- Invalid data format
- User not found
- **Action**: Send to DLQ, no retry

### Idempotency
- Maintained via `webhookEvents` collection
- Duplicate events properly skipped
- Consistent across sync and queue modes

---

## Rollback Plan

### Immediate Rollback
```bash
# Switch back to sync mode
gcloud run services update siraj \
  --update-env-vars="WEBHOOK_MODE=sync"
```

### Clean Rollback
1. Process any queued messages
2. Disable queue mode
3. Archive Pub/Sub resources
4. Remove worker service

---

## Testing Scenarios

### Happy Path
1. Webhook receives event → queues → worker processes → points credited
2. Verify <50ms webhook response
3. Verify idempotency works

### Error Handling
1. Unknown product → terminal failure → DLQ
2. Database timeout → retry → eventual success
3. Duplicate event → skip processing

### Performance
1. Load test with multiple events
2. Verify ordering per user
3. Check queue doesn't grow under normal load

---

## Success Criteria

- ✅ Webhook response time <50ms in queue mode
- ✅ Zero message loss under load
- ✅ Idempotency maintained across queue boundary
- ✅ Proper error classification (terminal vs transient)
- ✅ Full observability with metrics and alerts
- ✅ Clean rollback capability

---

This implementation provides the foundation for a production-ready, scalable webhook processing system.
