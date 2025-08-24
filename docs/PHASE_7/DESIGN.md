# Phase 7: Multi-Region Readiness - Design

**Updated on: 2025-01-10**

---

## Overview

Phase 7 implements multi-region readiness for the PayNow webhook system, providing disaster recovery capabilities, improved latency for global users, and enhanced reliability through geographic distribution.

---

## Architecture Goals

### Primary Objectives
1. **Zero Downtime**: Seamless failover between regions
2. **Global Latency**: Reduced response times for users worldwide
3. **Disaster Recovery**: Automatic failover during regional outages
4. **Backward Compatibility**: Existing functionality preserved
5. **Observability**: Comprehensive monitoring across regions

### Non-Goals
- Cross-region data replication (Firestore is already global)
- Active-active processing (single subscription prevents double-processing)
- Regional data sovereignty (not required for current use case)

---

## Multi-Region Architecture

### Current State (Single Region)
```
PayNow → us-central1 (Webhook + Worker) → Firestore (Global)
```

### Target State (Multi-Region)
```
PayNow → Global HTTPS LB → us-central1 + europe-west1 (Webhook)
                                    ↓
                              Global HTTPS LB → us-central1 + europe-west1 (Worker)
                                    ↓
                              Firestore (Global)
```

### Load Balancer Strategy
- **Webhook LB**: `hooks.siraj.life` → routes to both regions
- **Worker LB**: `worker.siraj.life` → single Pub/Sub subscription
- **Health Checks**: Standard HTTP health endpoints
- **Failover**: Automatic based on health check failures

---

## Event Schema Versioning

### Version 3 Schema (New)
```json
{
  "version": 3,
  "minCompatible": 2,
  "eventId": "evt_abc123",
  "eventType": "order.paid",
  "timestamp": "2025-01-10T12:00:00Z",
  "region": "us-central1",
  "data": {
    "order": {
      "id": "order_123",
      "customerId": "cust_456",
      "items": [...]
    }
  }
}
```

### Compatibility Rules
- **Accept**: `version >= minCompatible`
- **Reject**: `version < minCompatible` → DLQ with `verdict="drop_incompatible"`
- **Metrics**: Track compatibility rates by version

### Migration Strategy
1. **Phase 1**: Deploy with `eventSchema.version=3`, `eventSchema.minCompatible=2`
2. **Phase 2**: Monitor compatibility metrics
3. **Phase 3**: Increase `minCompatible` to 3 after validation

---

## Service Deployment

### Cloud Run Services
| Service | Region | URL | Purpose |
|---------|--------|-----|---------|
| `siraj-webhook-us` | us-central1 | `https://siraj-webhook-us-{project}.run.app` | Primary webhook processing |
| `siraj-webhook-eu` | europe-west1 | `https://siraj-webhook-eu-{project}.run.app` | Secondary webhook processing |
| `siraj-worker-us` | us-central1 | `https://siraj-worker-us-{project}.run.app` | Primary worker processing |
| `siraj-worker-eu` | europe-west1 | `https://siraj-worker-eu-{project}.run.app` | Secondary worker processing |

### Configuration
- **Identical Code**: Same Docker image deployed to all regions
- **Environment Variables**: Region-specific via Secret Manager
- **Service Accounts**: Separate SAs per region for security
- **Logging**: `region` field added to all structured logs

---

## Idempotency & Consistency

### Idempotency Strategy
- **Scope**: Global (Firestore is global)
- **Key**: PayNow `event_id` (unchanged)
- **Storage**: `webhookEvents` collection with TTL
- **Region Field**: Added for forensics and debugging

### Consistency Guarantees
- **Single Subscription**: Prevents double-processing
- **Ordering**: Maintained via `ordering_key`
- **Atomic Operations**: Firestore transactions ensure consistency
- **Audit Trail**: Complete history in ledger

---

## Observability & Monitoring

### Multi-Region Dashboard
- **Webhook Performance**: p95 ACK time by region
- **Worker Performance**: p95 processing time by region
- **Queue Health**: DLQ depth and delivery attempts by region
- **Load Balancer**: Backend health and traffic distribution

### Alerts
- **Region Outage**: No successful webhooks in region for 5m
- **Performance Skew**: EU p95 > 2× US p95 for 15m
- **DLQ Spikes**: >10 messages in 5m
- **Schema Incompatibility**: >0.1% drops in 10m

### Metrics
- `webhook_ack_p95_by_region`
- `worker_processing_p95_by_region`
- `dlq_depth_by_region`
- `schema_compatibility_rate`
- `region_failover_events`

---

## Disaster Recovery

### Failover Scenarios
1. **Webhook Region Failure**: Traffic automatically routes to healthy region
2. **Worker Region Failure**: Single subscription ensures processing continues
3. **Load Balancer Failure**: DNS failover to backup LB
4. **Database Issues**: Firestore global availability

### Recovery Procedures
1. **Automatic**: Health checks trigger failover
2. **Manual**: Admin can force traffic to specific region
3. **Rollback**: Feature flags disable multi-region if needed

### GameDay Drills
- **Quarterly**: Region failover simulation
- **Monthly**: DLQ replay procedures
- **Weekly**: Configuration rollback testing

---

## Security Considerations

### Service Account Isolation
- **Per-Region SAs**: `webhook-us-sa`, `webhook-eu-sa`, `worker-us-sa`, `worker-eu-sa`
- **Least Privilege**: Minimal required permissions per region
- **Cross-Project**: Deny writes to other projects

### Network Security
- **HTTPS Only**: All traffic encrypted
- **OIDC**: Worker endpoints require valid tokens
- **CORS**: Restricted to PayNow domains
- **Rate Limiting**: Per-region limits maintained

### Secret Management
- **Secret Manager**: Automatic replication enabled
- **Regional Access**: SAs can only access regional secrets
- **Rotation**: Hash salt and API keys rotated regularly

---

## Implementation Phases

### Phase 7A: Foundation (Current)
1. ✅ Event schema versioning
2. ✅ Multi-region feature flags
3. ✅ EU region service deployment
4. ✅ Global load balancers
5. ✅ Observability setup

### Phase 7B: Advanced DR (Future)
1. Cross-project disaster recovery
2. Automated backup/restore procedures
3. Multi-cloud failover options
4. Advanced monitoring and alerting

---

## Configuration

### Feature Flags
```typescript
multiRegion: {
  enabled: boolean,           // Master switch
  primaryRegion: string,      // "us-central1"
  secondaryRegion: string,    // "europe-west1"
  failoverEnabled: boolean,   // Automatic failover
}

eventSchema: {
  version: number,            // Current schema version
  minCompatible: number,      // Minimum accepted version
}
```

### Environment Variables
```bash
# Per-region configuration
REGION=us-central1
SERVICE_NAME=siraj-webhook-us
LOG_LEVEL=info

# Multi-region settings
MULTI_REGION_ENABLED=true
PRIMARY_REGION=us-central1
SECONDARY_REGION=europe-west1
```

---

## Testing Strategy

### Validation Scenarios
1. **Happy Path**: Both regions processing normally
2. **Schema Compatibility**: Version 1 events dropped correctly
3. **Region Failover**: US disabled, EU continues processing
4. **Queue Failover**: US worker disabled, EU processes via LB
5. **Throughput Test**: 2× normal load for 20 minutes
6. **Auditor Validation**: Zero drift, correct regional shares

### Success Criteria
- **Zero Downtime**: No failed webhooks during failover
- **Performance**: p95 < 50ms webhook, < 250ms worker
- **Consistency**: No duplicate credits or lost events
- **Observability**: All metrics and alerts functional

---

## Rollback Plan

### Emergency Rollback
1. **Feature Flag**: Set `multiRegion.enabled=false`
2. **DNS**: Point webhook URL back to single region
3. **Subscription**: Revert to direct worker endpoint
4. **Monitoring**: Verify single-region metrics

### Gradual Rollback
1. **Traffic Shift**: Reduce EU traffic to 0%
2. **Service Decommission**: Stop EU services
3. **LB Cleanup**: Remove EU backends
4. **Documentation**: Update runbooks

---

## Success Metrics

### Technical Metrics
- **Availability**: 99.9% uptime across regions
- **Latency**: p95 < 50ms webhook, < 250ms worker
- **Throughput**: Support 2× current load
- **Failover Time**: < 30 seconds automatic failover

### Business Metrics
- **Zero Revenue Loss**: No failed transactions during failover
- **User Experience**: Improved latency for global users
- **Operational Efficiency**: Reduced manual intervention
- **Compliance**: Maintained audit trails and security

---

This design provides a robust foundation for multi-region operations while maintaining backward compatibility and operational simplicity.
