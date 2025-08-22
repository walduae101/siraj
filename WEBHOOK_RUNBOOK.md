# PayNow Webhook Runbook

## Alert Response Procedures

### 🚨 High Failure Rate Alert (>1%)

**Immediate Actions:**
1. Check recent logs for error patterns:
   ```bash
   gcloud logging read 'jsonPayload.component="paynow_webhook" AND jsonPayload.severity="ERROR"' --limit=20
   ```

2. Common causes:
   - Invalid signature → Check if PayNow rotated webhook secret
   - Timestamp issues → Verify server time sync
   - User mapping failures → Check paynowCustomers collection
   - Product mapping issues → Verify Secret Manager config

3. Check PayNow dashboard for webhook delivery status

### 🚫 No Credits Alert (30 minutes)

**Immediate Actions:**
1. Verify webhook endpoint is accessible:
   ```bash
   curl -I https://siraj.life/api/paynow/webhook
   ```
   Expected: 405 Method Not Allowed

2. Check Cloud Run service status:
   - [Cloud Run Console](https://console.cloud.google.com/run/detail/us-central1/siraj/metrics)
   - Verify instances are running
   - Check for deployment issues

3. Check PayNow webhook configuration:
   - Verify webhook URL is correct
   - Check if webhooks are paused/disabled

### 🐌 High Latency Alert (p95 > 5s)

**Immediate Actions:**
1. Check Firestore performance:
   - [Firestore Metrics](https://console.cloud.google.com/firestore/databases/-default-/monitor)
   - Look for hot documents or transaction conflicts

2. Check Cloud Run scaling:
   ```bash
   gcloud run services describe siraj --region=us-central1 --format="value(spec.template.spec.containerConcurrency)"
   ```

3. Review recent webhook volumes:
   ```bash
   gcloud logging read 'jsonPayload.component="paynow_webhook"' --format="summary" --limit=100
   ```

### 💀 Endpoint Down Alert

**Immediate Actions:**
1. Check Cloud Run deployment status:
   ```bash
   gcloud run services describe siraj --region=us-central1
   ```

2. Check recent deployments:
   ```bash
   gcloud run revisions list --service=siraj --region=us-central1
   ```

3. Roll back if needed:
   ```bash
   gcloud run services update-traffic siraj --to-revisions=PREVIOUS_REVISION=100 --region=us-central1
   ```

### 🔐 Signature Verification Failures

**SECURITY ALERT - Immediate Action Required:**

1. Check if legitimate traffic:
   ```bash
   gcloud logging read 'jsonPayload.rejection_reason="invalid_signature"' --format=json --limit=10
   ```

2. Verify webhook secret hasn't changed:
   - Check with PayNow support
   - Verify Secret Manager hasn't been modified

3. If under attack:
   - Temporarily add IP allowlist in Cloud Armor
   - Contact security team
   - Increase monitoring

## Common Operations

### View Recent Webhook Activity
```bash
gcloud logging read \
  'jsonPayload.component="paynow_webhook"' \
  --limit=50 \
  --format="table(
    timestamp,
    jsonPayload.event_id,
    jsonPayload.event_type,
    jsonPayload.uid,
    jsonPayload.points,
    jsonPayload.processing_ms
  )"
```

### Find Specific Event
```bash
EVENT_ID="your_event_id_here"
gcloud logging read "jsonPayload.event_id=\"$EVENT_ID\"" --limit=10
```

### Replay Event by ID

**Note**: Manual replay coming in Phase 2. For now:

1. Find the original webhook payload in logs
2. Verify it wasn't already processed:
   ```
   Check Firestore: webhookEvents/{event_id}
   ```
3. If needed, contact PayNow to resend the webhook

### Check User's Webhook History
```bash
USER_ID="your_user_id_here"
gcloud logging read "jsonPayload.uid=\"$USER_ID\" AND jsonPayload.component=\"paynow_webhook\"" --limit=20
```

## Key Firestore Paths

- **Webhook tracking**: `webhookEvents/{event_id}`
- **User wallet**: `users/{uid}/wallet/points`
- **Transaction history**: `users/{uid}/ledger/{entry_id}`
- **Customer mapping**: `paynowCustomers/{customer_id}`

## Monitoring Links

- [Dashboard](https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906)
- [Alerts](https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906)
- [Metrics](https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906)
- [Cloud Run Logs](https://console.cloud.google.com/run/detail/us-central1/siraj/logs?project=walduae-project-20250809071906)
- [Uptime Checks](https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906)

## Escalation

1. **Level 1** (0-15 min): On-call engineer follows this runbook
2. **Level 2** (15-30 min): If unresolved, escalate to senior engineer
3. **Level 3** (30+ min): If payment processing affected, notify:
   - Product team
   - PayNow support contact
   - Customer support team (for user communications)

## Recovery Verification

After resolving any issue:

1. Send test webhook to verify fix
2. Check metrics return to normal
3. Verify no credits were lost (reconciliation)
4. Document root cause and update runbook

