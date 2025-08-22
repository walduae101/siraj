# Phase 2: Queue + Worker Architecture Implementation

**Updated on: 2025-01-10**

---

## Overview

Phase 2 transforms the PayNow webhook from synchronous processing to an asynchronous queue-based architecture using Google Cloud Pub/Sub. This provides significant performance improvements and enhanced reliability.

---

## Architecture

### Current (Phase 1)
```
PayNow → Webhook → Process → Credit Points → Firestore
         (100-500ms)     ↓
                    Structured Logs → Metrics → Alerts
```

### Target (Phase 2)
```
PayNow → Webhook → Pub/Sub → Worker → Firestore
         (<50ms)     ↓        ↓
                    Queue    DLQ
```

---

## Implementation Components

### 1. Feature Flag System
**File**: `src/server/config.ts`
```typescript
features: {
  webhookMode: "sync" | "queue"  // Default: "sync"
}
```

**Environment Variable**: `WEBHOOK_MODE=queue`

### 2. Enhanced Webhook Handler
**File**: `src/app/api/paynow/webhook/route.ts`

**Queue Mode Behavior**:
1. Validate HMAC signature (base64, lowercase headers)
2. Check timestamp replay protection (5-minute window)  
3. Write minimal data to `webhookEvents` (status: "queued")
4. Publish event to Pub/Sub with ordering key
5. Return 200 immediately (<50ms target)

**Sync Mode**: Unchanged existing behavior for safe rollback

### 3. Pub/Sub Publisher Service
**File**: `src/server/services/pubsubPublisher.ts`

**Features**:
- Ordering key ensures serial processing per user (uid > customer_id)
- Minimal PII in messages (IDs only, no emails)
- Health check capability for monitoring
- Graceful fallback on publishing failures

### 4. Worker Service
**File**: `src/app/api/tasks/paynow/process/route.ts`
**Endpoint**: `/api/tasks/paynow/process`

**Features**:
- OIDC authentication from Pub/Sub push subscription
- Idempotent processing using `webhookEvents` collection
- Transaction-safe credit operations
- Terminal vs transient error classification
- Support for orders and subscriptions

### 5. Transaction-Safe Points Service
**Enhancement**: `pointsService.creditPointsInTransaction()`

**Benefits**:
- Atomic wallet updates across queue boundary
- Idempotency maintained via ledger entries
- Consistent with existing credit operations

---

## Cloud Infrastructure Requirements

### 1. Pub/Sub Resources

#### Main Topic: `paynow-events`
```bash
gcloud pubsub topics create paynow-events \
  --message-retention-duration=7d \
  --project=walduae-project-20250809071906
```

#### Dead Letter Topic: `paynow-events-dlq`  
```bash
gcloud pubsub topics create paynow-events-dlq \
  --message-retention-duration=14d \
  --project=walduae-project-20250809071906
```

### 2. Service Accounts

#### Publisher SA (Webhook → Pub/Sub)
```bash
gcloud iam service-accounts create pubsub-publisher \
  --display-name="PayNow Webhook Publisher"

gcloud pubsub topics add-iam-policy-binding paynow-events \
  --member="serviceAccount:pubsub-publisher@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

#### Push SA (Pub/Sub → Worker)
```bash
gcloud iam service-accounts create pubsub-push \
  --display-name="Pub/Sub Push Authentication"
```

#### Worker SA (Worker → Firestore + Secrets)
```bash
gcloud iam service-accounts create paynow-worker \
  --display-name="PayNow Worker Service"

# Grant required permissions
gcloud projects add-iam-policy-binding walduae-project-20250809071906 \
  --member="serviceAccount:paynow-worker@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding walduae-project-20250809071906 \
  --member="serviceAccount:paynow-worker@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Cloud Run Worker Service

#### Deploy Worker
```bash
gcloud run deploy paynow-worker \
  --source . \
  --region=us-central1 \
  --service-account=paynow-worker@walduae-project-20250809071906.iam.gserviceaccount.com \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=8 \
  --no-allow-unauthenticated \
  --project=walduae-project-20250809071906
```

#### Grant Push SA Access to Worker
```bash
gcloud run services add-iam-policy-binding paynow-worker \
  --region=us-central1 \
  --member="serviceAccount:pubsub-push@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=walduae-project-20250809071906
```

### 4. Push Subscription

#### Create Subscription with OIDC Auth
```bash
# Get worker URL
WORKER_URL=$(gcloud run services describe paynow-worker \
  --region=us-central1 \
  --format="value(status.url)" \
  --project=walduae-project-20250809071906)

# Create push subscription
gcloud pubsub subscriptions create paynow-events-sub \
  --topic=paynow-events \
  --push-endpoint="$WORKER_URL/api/tasks/paynow/process" \
  --push-auth-service-account="pubsub-push@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --ack-deadline=600 \
  --max-delivery-attempts=5 \
  --min-retry-delay=10s \
  --max-retry-delay=600s \
  --dead-letter-topic=paynow-events-dlq \
  --enable-ordering \
  --project=walduae-project-20250809071906
```

---

## Deployment Process

### Phase 1: Infrastructure Setup
1. **Create Pub/Sub topics** (main + DLQ)
2. **Create service accounts** with least-privilege roles
3. **Deploy worker service** with private access
4. **Configure push subscription** with OIDC authentication

### Phase 2: Enable Queue Mode
1. **Grant publisher permissions** to existing webhook service
2. **Set environment variable**: `WEBHOOK_MODE=queue`
3. **Deploy updated webhook** with queue support
4. **Verify worker processing** with test events

### Phase 3: Monitoring Enhancement
1. **Create queue metrics** (published, processed, failed)
2. **Update dashboard** with queue widgets  
3. **Add queue alerts** (backlog, DLQ, worker failures)
4. **Test alert notifications** for queue-specific scenarios

---

## Testing & Validation

### End-to-End Flow Test
1. **Send test webhook** → Verify queue status "queued"
2. **Monitor worker logs** → Verify processing
3. **Check Firestore** → Verify points credited
4. **Validate metrics** → Queue published +1, worker processed +1

### Performance Validation
- **Webhook Response**: <50ms p95 (vs 100-500ms sync mode)
- **Worker Processing**: <250ms p95 for credit operations
- **Queue Latency**: <5s from publish to processing completion

### Error Handling Test
1. **Unknown Product**: Should go to DLQ after max attempts
2. **Database Timeout**: Should retry with exponential backoff
3. **Duplicate Event**: Should skip processing in worker

### Ordering Validation
- Send 3 events rapidly for same user
- Verify serial processing order maintained
- Check final wallet balance is correct

---

## Monitoring Enhancements

### New Log-based Metrics
```bash
# Queue published events
gcloud logging metrics create paynow_queue_published \
  --description="Events published to PayNow queue" \
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.status="queued"'

# Worker processed events  
gcloud logging metrics create paynow_worker_processed \
  --description="Events successfully processed by worker" \
  --log-filter='jsonPayload.component="paynow_worker" AND jsonPayload.message="Worker processed event successfully"'
```

### Queue-Specific Alerts
1. **Queue Backlog**: `num_undelivered_messages > 100` for 5 minutes
2. **Worker Failures**: Any worker errors for 1 minute
3. **DLQ Messages**: Any messages in dead letter queue
4. **Processing Lag**: Oldest unacked message age > 5 minutes

### Enhanced Dashboard
- **Queue Depth**: Real-time backlog monitoring
- **Message Age**: Oldest unprocessed message age
- **Worker Rate**: Processing events per minute
- **DLQ Status**: Dead letter queue message count

---

## Error Classification & Handling

### Transient Errors (Retry)
- **Database timeouts**: Firestore temporarily unavailable
- **Network issues**: Temporary connectivity problems
- **Resource constraints**: CPU/memory limits reached
- **Response**: 5xx status → Pub/Sub automatic retry with exponential backoff

### Terminal Errors (No Retry)
- **Unknown product ID**: Product not in mapping configuration
- **Invalid data format**: Malformed webhook payload
- **User not found**: Customer cannot be mapped to Firebase user
- **Response**: 2xx status → Message sent to dead letter queue

### Idempotency Handling
- **Duplicate detection**: Via `webhookEvents` collection status
- **Consistent behavior**: Same logic in sync and queue modes
- **Transaction safety**: Atomic updates prevent race conditions

---

## Rollback Procedures

### Immediate Rollback (Zero Downtime)
```bash
# Switch webhook back to sync mode
gcloud run services update siraj \
  --update-env-vars="WEBHOOK_MODE=sync" \
  --region=us-central1 \
  --project=walduae-project-20250809071906
```

**Verification**:
1. Send test webhook
2. Verify direct processing (no queue)
3. Confirm points credited
4. Check no new Pub/Sub messages

### Queue Cleanup (Post-Rollback)
```bash
# Check for remaining messages
gcloud pubsub subscriptions pull paynow-events-sub \
  --auto-ack --limit=10 --project=walduae-project-20250809071906

# Process DLQ messages if needed
gcloud pubsub subscriptions pull paynow-events-dlq-sub \
  --auto-ack --limit=10 --project=walduae-project-20250809071906
```

---

## Success Criteria

### Performance Targets
- ✅ Webhook response time: <50ms p95 (from 100-500ms)
- ✅ Zero dropped events under load
- ✅ Worker processing: <250ms p95  
- ✅ Queue lag: <5s publish-to-completion

### Reliability Targets  
- ✅ Idempotency: 100% duplicate detection
- ✅ Error handling: Proper terminal vs transient classification
- ✅ Ordering: Serial processing per user maintained
- ✅ Dead letter queue: <1% of total messages

### Operational Targets
- ✅ Rollback time: <2 minutes to revert
- ✅ Observability: Complete queue metrics and alerts
- ✅ Documentation: Runbooks and setup guides complete
- ✅ Incident response: Clear escalation procedures

---

## Dependencies

### Required Packages
- `@google-cloud/pubsub@^4.3.0` (added to package.json)

### Infrastructure Dependencies
- Google Cloud Pub/Sub API enabled
- Cloud Run API enabled  
- Service accounts with proper IAM roles
- Secret Manager access for configuration

---

## Next Steps

After successful Phase 2 deployment:
1. **Monitor performance** for 24-48 hours
2. **Validate ordering** and idempotency under load
3. **Test failure scenarios** and DLQ handling
4. **Plan Phase 3**: Business rules, refunds, reconciliation

---

This guide provides everything needed to successfully deploy and operate the Phase 2 queue architecture.
