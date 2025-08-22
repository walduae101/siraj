# PayNow Webhook Operations Runbook

**Updated on: 2025-01-10**

---

## Alert Response Procedures

### 🚨 High Failure Rate Alert (>1%)

**Alert Trigger**: Webhook failure rate exceeds 1% over 5 minutes

**Immediate Actions**:
1. **Check error patterns**:
   ```bash
   gcloud logging read 'jsonPayload.component="paynow_webhook" AND jsonPayload.severity="ERROR"' \
     --limit=20 --project=walduae-project-20250809071906
   ```

2. **Common causes & fixes**:
   - **Invalid signature** → Verify PayNow webhook secret hasn't rotated
   - **Timestamp issues** → Check server time sync and PayNow clock skew
   - **User mapping failures** → Validate paynowCustomers collection
   - **Product mapping** → Verify Secret Manager product configuration

3. **Verify PayNow status**: Check PayNow dashboard for webhook delivery issues

**Escalation**: If >5% failure rate persists >10 minutes

---

### 🚫 No Credits Alert (30 minutes)

**Alert Trigger**: No points credited for 30 minutes despite webhook activity

**Immediate Actions**:
1. **Endpoint health check**:
   ```bash
   curl -I https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook
   # Expected: 405 Method Not Allowed
   ```

2. **Service status**:
   - Check [Cloud Run Console](https://console.cloud.google.com/run/detail/us-central1/siraj/metrics?project=walduae-project-20250809071906)
   - Verify instances running and healthy
   - Check recent deployments for issues

3. **PayNow configuration**:
   - Verify webhook URL points to correct endpoint
   - Check if webhooks are paused in PayNow dashboard
   - Validate webhook secret configuration

**Escalation**: If no credits >60 minutes and webhooks are being sent

---

### 🐌 High Latency Alert (p95 > 5s)

**Alert Trigger**: 95th percentile processing time exceeds 5 seconds for 5 minutes

**Immediate Actions**:
1. **Database performance**:
   - Check [Firestore Monitoring](https://console.cloud.google.com/firestore/databases/-default-/monitor?project=walduae-project-20250809071906)
   - Look for hot documents, index misses, or transaction conflicts
   - Review concurrent request patterns

2. **Cloud Run scaling**:
   ```bash
   gcloud run services describe siraj --region=us-central1 \
     --format="table(spec.template.spec.containerConcurrency,status.conditions)"
   ```

3. **Recent activity analysis**:
   ```bash
   gcloud logging read 'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>5000' \
     --limit=10 --project=walduae-project-20250809071906
   ```

**Escalation**: If latency >10s sustained or affecting user experience

---

### 💀 Endpoint Down Alert

**Alert Trigger**: Uptime check fails 2 consecutive times

**Immediate Actions**:
1. **Deployment status**:
   ```bash
   gcloud run services describe siraj --region=us-central1 --project=walduae-project-20250809071906
   ```

2. **Recent revisions**:
   ```bash
   gcloud run revisions list --service=siraj --region=us-central1 \
     --project=walduae-project-20250809071906 --limit=5
   ```

3. **Emergency rollback** (if needed):
   ```bash
   # Get previous working revision
   PREV_REVISION=$(gcloud run revisions list --service=siraj --region=us-central1 \
     --format="value(metadata.name)" --limit=2 | tail -n1)
   
   # Rollback traffic
   gcloud run services update-traffic siraj \
     --to-revisions=$PREV_REVISION=100 \
     --region=us-central1 --project=walduae-project-20250809071906
   ```

**Escalation**: Immediately if endpoint completely unavailable

---

### 🔐 Signature Verification Failures

**Alert Trigger**: >5 signature failures in 5 minutes

**⚠️ SECURITY ALERT - Immediate Action Required**

**Immediate Actions**:
1. **Analyze failure patterns**:
   ```bash
   gcloud logging read 'jsonPayload.rejection_reason="invalid_signature"' \
     --format="table(timestamp,httpRequest.remoteIp,jsonPayload.headers)" \
     --limit=20 --project=walduae-project-20250809071906
   ```

2. **Verify legitimate traffic**:
   - Check if PayNow rotated webhook secret
   - Verify Secret Manager configuration
   - Contact PayNow support for confirmation

3. **Security response** (if malicious):
   - Enable Cloud Armor IP blocking
   - Increase logging verbosity
   - Contact security team
   - Consider temporary webhook disabling

**Escalation**: Immediately for suspected attacks

---

## Common Operations

### View Recent Activity
```bash
# Get last 50 webhook events with key details
gcloud logging read 'jsonPayload.component="paynow_webhook"' \
  --limit=50 --project=walduae-project-20250809071906 \
  --format="table(
    timestamp,
    jsonPayload.event_id,
    jsonPayload.event_type,
    jsonPayload.uid,
    jsonPayload.points,
    jsonPayload.processing_ms,
    jsonPayload.idempotent
  )"
```

### Find Specific Event
```bash
# Search by event ID
EVENT_ID="your_event_id_here"
gcloud logging read "jsonPayload.event_id=\"$EVENT_ID\"" \
  --project=walduae-project-20250809071906 --limit=10
```

### Check User Transaction History
```bash
# Get user's webhook-related transactions
USER_ID="your_user_id_here" 
gcloud logging read "jsonPayload.uid=\"$USER_ID\" AND jsonPayload.component=\"paynow_webhook\"" \
  --project=walduae-project-20250809071906 --limit=20
```

### Performance Analysis
```bash
# Get p95 latency from recent logs
gcloud logging read 'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' \
  --format="value(jsonPayload.processing_ms)" --limit=100 \
  --project=walduae-project-20250809071906 | \
  sort -n | tail -n 5
```

---

## Health Checks

### Webhook Endpoint
```bash
# Should return 405 Method Not Allowed
curl -I https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook
```

### Cloud Run Service  
```bash
# Get current service status
gcloud run services describe siraj --region=us-central1 \
  --project=walduae-project-20250809071906 \
  --format="table(status.conditions.type,status.conditions.status,status.url)"
```

### Firestore Collections
- **webhookEvents**: Recent events with TTL fields
- **paynowCustomers**: Customer-to-user mappings
- **users/{uid}/wallet/points**: Wallet balances
- **users/{uid}/ledger**: Transaction history

---

## Key Firestore Paths

### Webhook Tracking
```
webhookEvents/{event_id}
├── eventId: string
├── status: "received" | "processed" | "failed"  
├── expiresAt: Timestamp (30-day TTL)
├── processedAt: Timestamp
└── result: object
```

### User Wallet
```
users/{uid}/wallet/points
├── paidBalance: number
├── promoBalance: number
├── promoLots: PromoLot[]
├── updatedAt: Timestamp  
└── v: number (schema version)
```

### Transaction Ledger
```
users/{uid}/ledger/{entry_id}
├── type: "credit" | "spend"
├── amount: number
├── source: string  
├── actionId: string (idempotency)
├── createdAt: Timestamp
└── metadata: object
```

---

## Monitoring Resources

### Quick Links
- [**Dashboard**](https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906) - Real-time metrics
- [**Alert Policies**](https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906) - All 6 policies
- [**Logs Explorer**](https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906) - Structured logs
- [**Cloud Run**](https://console.cloud.google.com/run/detail/us-central1/siraj?project=walduae-project-20250809071906) - Service health
- [**Firestore**](https://console.cloud.google.com/firestore?project=walduae-project-20250809071906) - Data verification

### Log Queries
```bash
# All webhook activity
jsonPayload.component="paynow_webhook"

# Only errors
jsonPayload.component="paynow_webhook" AND severity="ERROR"

# Performance analysis  
jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>1000

# Security events
jsonPayload.component="paynow_webhook" AND jsonPayload.rejection_reason!=""
```

---

## Escalation Matrix

| Alert | Response Time | Primary | Secondary | Critical |
|-------|---------------|---------|-----------|----------|
| High Failure Rate | 5 min | On-call Engineer | Tech Lead | CTO |
| No Credits | 15 min | On-call Engineer | Product Team | CTO |
| High Latency | 10 min | Platform Engineer | Tech Lead | - |
| Endpoint Down | 1 min | On-call Engineer | Platform Team | CTO |
| Signature Failures | 1 min | Security Team | Tech Lead | CISO |

### Contact Information
- **On-call Engineer**: Slack #alerts channel
- **Tech Lead**: Direct escalation for payment issues  
- **Security Team**: #security-incidents for signature alerts
- **Product Team**: User impact coordination

---

## Recovery Verification

**After resolving any incident**:

1. **Functional Test**: Send test webhook and verify processing
2. **Metrics Check**: Confirm metrics return to normal ranges
3. **Audit**: Verify no credits were lost during incident
4. **Documentation**: Update runbook with lessons learned

**Recovery Criteria**:
- [ ] Webhook processing normally
- [ ] All metrics within normal ranges
- [ ] No backlog of unprocessed events
- [ ] User impact resolved
- [ ] Root cause documented

---

This runbook is maintained by the Platform Engineering team. Update with lessons learned from each incident.
