# Phase 1 - Observability Activation Checklist

## Prerequisites ✅

- [x] Phase 0 verification complete
- [x] Structured logging implemented
- [x] Monitoring configuration files created
- [ ] Firestore TTL policy configured (manual step)

## Activation Steps

### 1. Configure Firestore TTL (Manual)
```
1. Go to: https://console.firebase.google.com/project/walduae-project-20250809071906/firestore/databases/-default-/time-to-live
2. Click "Create policy"
3. Set:
   - Collection group: webhookEvents
   - Date/Time field: expiresAt
4. Click "Create"
```

### 2. Verify IAM Permissions
```powershell
# Check Cloud Run service account permissions
gcloud run services describe siraj --region=us-central1 --format="value(spec.template.spec.serviceAccountName)"

# Then check its roles
gcloud projects get-iam-policy walduae-project-20250809071906 `
  --flatten="bindings[].members" `
  --filter="bindings.members:serviceAccount:YOUR_SERVICE_ACCOUNT@*" `
  --format="table(bindings.role)"
```

Required roles:
- `roles/logging.logWriter`
- `roles/monitoring.metricWriter`

### 3. Run Monitoring Setup
```powershell
cd monitoring
.\setup-monitoring.ps1
```

### 4. Apply Alert Policies
```powershell
# Update email address first
$content = Get-Content monitoring\paynow-webhook-alerts.yaml -Raw
$content = $content -replace 'alerts@siraj.life', 'your-actual-email@domain.com'
$content | Set-Content monitoring\paynow-webhook-alerts.yaml

# Apply policies
gcloud alpha monitoring policies create --policy-from-file=monitoring/paynow-webhook-alerts.yaml
```

### 5. Run Test Scenarios
```powershell
# Install dependencies if needed
cd scripts
npm install

# Run test scenarios
npx tsx test-webhook-scenarios.ts
```

### 6. Verify Everything is Working

#### Check Logs
```powershell
# View structured logs
gcloud logging read 'jsonPayload.component="paynow_webhook"' --limit=50 --format=json
```

#### Check Metrics
Go to: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906

Verify these metrics exist:
- paynow_webhook_requests
- paynow_webhook_failures
- paynow_points_credited
- paynow_webhook_latency

#### Check Dashboard
Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906

Look for "PayNow Webhook Monitoring" dashboard

#### Check Alerts
Go to: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906

Verify 5 alert policies are created

## Expected Test Results

| Scenario | Expected Status | Expected Log |
|----------|----------------|--------------|
| Valid Purchase | 200 OK | "Webhook processed successfully" |
| Duplicate Event (1st) | 200 OK | "Webhook processed successfully" |
| Duplicate Event (2nd) | 200 OK | "Webhook already processed - idempotent skip" |
| Bad Signature | 401 Unauthorized | "Webhook rejected - invalid signature" |
| Stale Timestamp | 401 Unauthorized | "Webhook rejected - invalid timestamp" |
| Missing Headers | 401 Unauthorized | "Webhook rejected - invalid signature" |

## Performance Verification

After running tests, check latency:
```powershell
# Check p95 latency
gcloud logging read `
  'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' `
  --format="value(jsonPayload.processing_ms)" `
  --limit=100 | Sort-Object {[int]$_} | Select-Object -Last 5
```

Target: p95 < 250ms

## Troubleshooting

### If metrics don't appear:
1. Wait 2-3 minutes for propagation
2. Check logs are properly structured: `gcloud logging read 'jsonPayload.component="paynow_webhook"' --limit=10`
3. Verify service account has logging.logWriter role

### If dashboard is empty:
1. Ensure metrics are created first
2. Wait for data to populate (run test scenarios)
3. Check time range in dashboard (set to last 1 hour)

### If alerts don't fire:
1. Verify notification channel email is correct
2. Check alert conditions match your test scenario
3. Some alerts have 5-minute windows - wait accordingly

## Success Criteria

- [ ] All test scenarios pass with expected results
- [ ] Structured logs visible in Cloud Logging
- [ ] All 4 metrics populating with data
- [ ] Dashboard showing webhook activity
- [ ] Alerts created (test failure alert with bad signature)
- [ ] p95 latency < 250ms

## Next Steps

Once all success criteria are met:
1. Document the dashboard URL
2. Add alert notification channels for your team
3. Set up alert escalation policies
4. Schedule monthly metric reviews
5. Proceed to Phase 2 (Queue + Worker split)

