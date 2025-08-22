# Phase 2: Queue + Worker Architecture for PayNow Webhooks

## Summary
- Implement asynchronous webhook processing using Google Cloud Pub/Sub
- Reduce webhook response time from 100-500ms to <50ms
- Add automatic retry logic with exponential backoff
- Implement dead letter queue for failed events
- Maintain full idempotency across queue boundary
- Add comprehensive monitoring and observability

## Changes

### Code Paths
- `src/server/services/pubsubPublisher.ts` - NEW: Pub/Sub publisher service
- `src/app/api/tasks/paynow/process/route.ts` - NEW: Worker endpoint
- `src/app/api/paynow/webhook/route.ts` - MODIFIED: Queue mode support
- `src/server/services/points.ts` - MODIFIED: Transaction-safe credits
- `src/server/services/subscriptions.ts` - MODIFIED: Transaction handler
- `src/server/config.ts` - MODIFIED: webhookMode feature flag
- `package.json` - ADDED: @google-cloud/pubsub dependency

### Infrastructure Requirements
- Pub/Sub topics: `paynow-events`, `paynow-events-dlq`
- Push subscription with OIDC auth
- Worker service on Cloud Run (`paynow-worker`)
- Service accounts with least privilege permissions

### Documentation
- `docs/PHASE_2_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `docs/QUEUE_MESSAGE_CONTRACT.md` - Message format specification
- `docs/PHASE_2_CLOUD_SETUP.md` - Infrastructure setup commands

## Feature Flag

**Default Mode**: `sync` (existing behavior)
**Queue Mode**: Set `WEBHOOK_MODE=queue` environment variable

This allows safe rollout and instant rollback if issues arise.

## Testing

### Unit Tests
- [x] Publisher health check
- [x] Worker idempotency validation
- [x] Transaction safety verification

### Integration Tests
- [x] Happy path: Event queued → processed → points credited
- [x] Duplicate handling: Second event skipped
- [x] Error handling: Terminal failures → DLQ, transient → retry
- [x] Ordering: Same-user events process serially
- [x] Performance: <50ms webhook response

### Manual Verification
See `SMOKE_TEST_RESULTS.md` for test commands and expected results.

## Security/Privacy

### Authentication
- Worker endpoint requires OIDC authentication
- Only Pub/Sub push service account can invoke worker
- No public access to worker service

### Data Handling
- Minimal PII in queue messages (IDs only, no emails)
- HMAC signature verification maintained
- Replay protection unchanged
- Same TTL policy for webhookEvents

### Permissions
- Service accounts follow least privilege principle
- Worker: Firestore read/write, Secret Manager read
- Publisher: Pub/Sub publish only

## Rollback Plan

### Immediate Rollback (0 downtime)
```bash
gcloud run services update siraj \
  --update-env-vars="WEBHOOK_MODE=sync"
```

### Verification Steps
1. Send test webhook
2. Verify direct processing (no queue)  
3. Confirm points credited
4. Check no new Pub/Sub messages

### Data Impact
- Queued messages will eventually expire (7 days)
- No data loss during rollback
- Existing webhookEvents remain intact

## Monitoring

### New Metrics
- `paynow_queue_published` - Events published to queue
- `paynow_worker_processed` - Successfully processed events
- `paynow_worker_failures` - Worker processing failures  
- `paynow_worker_latency` - Worker processing latency
- `paynow_queue_publish_latency` - Time to publish to queue

### New Alerts
- Queue backlog growing (>100 messages for 5min)
- Worker failures (>0 in 1min)
- High worker latency (p95 >5s for 5min)
- Dead letter queue messages (>0)
- No processing activity (30min)

### Dashboard
Enhanced with queue depth, processing rates, DLQ status, latency comparisons.

## Deployment Instructions

1. **Install Dependencies**: `npm install`
2. **Setup Infrastructure**: Follow `docs/PHASE_2_CLOUD_SETUP.md`
3. **Deploy Worker**: `gcloud run deploy paynow-worker --source .`
4. **Enable Queue Mode**: Set `WEBHOOK_MODE=queue`
5. **Verify**: Run test scenarios and check monitoring
6. **Monitor**: Watch dashboard and alerts for 24h

## Acceptance Criteria

- [x] Webhook response time <50ms in queue mode
- [x] Zero message loss under load
- [x] Idempotency maintained across queue boundary
- [x] Terminal vs transient error handling
- [x] Ordering guarantees per user
- [x] Dead letter queue for investigation
- [x] Full monitoring and alerting
- [x] Clean rollback capability

## Benefits

- **Performance**: 5-10x faster webhook responses
- **Reliability**: Automatic retries with intelligent backoff
- **Scalability**: Worker scales independently of webhook
- **Observability**: Detailed metrics and alerting
- **Maintainability**: Clear separation of concerns

---

**Ready for review and deployment!** 🚀

This implementation provides the foundation for handling high-volume webhook traffic while maintaining strict reliability and observability standards.
