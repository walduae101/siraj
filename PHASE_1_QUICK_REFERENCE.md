# Phase 1 Quick Reference Card

## Essential URLs

### Monitoring
- 📊 **Dashboard**: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
- 🚨 **Alerts**: https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906
- 📈 **Metrics**: https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906
- 🔍 **Logs**: https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906
- ✅ **Uptime**: https://console.cloud.google.com/monitoring/uptime?project=walduae-project-20250809071906

### Infrastructure
- 🏃 **Cloud Run**: https://console.cloud.google.com/run/detail/us-central1/siraj/details?project=walduae-project-20250809071906
- 🔥 **Firestore**: https://console.cloud.google.com/firestore/data/panel/users?project=walduae-project-20250809071906
- 👤 **IAM**: https://console.cloud.google.com/iam-admin/iam?project=walduae-project-20250809071906

## Test Commands

### Set Test Environment (PowerShell)
```powershell
$env:PAYNOW_WEBHOOK_SECRET = "your_test_secret"
$env:NEXT_PUBLIC_WEBSITE_URL = "https://siraj.life"
```

### Run Test Scenarios
```powershell
cd scripts
npx tsx test-webhook-scenarios.ts
```

### Check Logs
```powershell
gcloud logging read 'jsonPayload.component="paynow_webhook"' --limit=20 --format=json
```

### Check p95 Latency
```powershell
gcloud logging read 'jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' --format="value(jsonPayload.processing_ms)" --limit=100 | Sort-Object {[int]$_} | Select-Object -Last 5
```

## Alert Thresholds

| Alert | Condition | Duration |
|-------|-----------|----------|
| Failure Rate | > 1% | 5 min |
| No Credits | = 0 | 30 min |
| High Latency | p95 > 5000ms | 5 min |
| Endpoint Down | 2 failures | consecutive |
| Bad Signatures | ≥ 5 | 5 min |

## Test Scenarios Expected Results

| # | Scenario | Status | Log Message | Metrics |
|---|----------|--------|-------------|---------|
| A | Happy Path | 200 | "processed successfully" | +points |
| B | Duplicate | 200 | "already processed" | no points |
| C | Stale Time | 401 | "invalid timestamp" | +failure |
| D | Bad Sig | 401 | "invalid signature" | +failure, alert |
| E | Unmapped | 200 | "unmapped_product" | +failure |

## Firestore Paths to Check

- Webhook tracking: `webhookEvents/{event_id}`
- User wallet: `users/{uid}/wallet/points`
- Transaction log: `users/{uid}/ledger/{entry_id}`
- Customer map: `paynowCustomers/{customer_id}`

## Success Criteria

✅ **Phase 1 is complete when:**
1. Dashboard shows data for all 4 metrics
2. All 5 alerts are created and active
3. At least 1 alert fired during testing
4. All test scenarios behaved as expected
5. p95 latency confirmed < 250ms
6. Zero client writes verified on success page

## Troubleshooting

**No data in metrics?**
- Wait 2-3 minutes for log ingestion
- Check logs format: `gcloud logging read 'resource.type="cloud_run_revision"' --limit=5`

**Dashboard empty?**
- Expand time range to 6 hours
- Run test scenarios again
- Refresh the page

**Alerts not firing?**
- Check threshold values
- Verify notification channel
- Run more bad signature tests

**High latency?**
- Check for cold starts in first request
- Verify logging happens after response
- Look for blocking operations

