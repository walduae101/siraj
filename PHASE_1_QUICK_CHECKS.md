# Phase 1 Quick Checks

## Before You Start
```
✓ Test environment only
✓ Test webhook secret ready  
✓ Test product IDs identified
✓ DevTools open on Network tab
```

## IAM Roles Required

**Cloud Run Service Account**:
- Logs Writer
- Monitoring Metric Writer  
- Firestore User

**Your Account**:
- Monitoring Admin
- Logs Configuration Writer

## Metrics to Verify
1. `paynow_webhook_requests`
2. `paynow_webhook_failures`
3. `paynow_points_credited`
4. `paynow_webhook_latency`

## 5 Alerts to Create
1. **Failure Rate** > 1% for 5 min
2. **No Credits** for 30 min
3. **Latency** p95 > 500ms for 5 min
4. **Uptime** 2 consecutive fails
5. **Bad Signatures** ≥ 5 in 5 min

## 5 Test Scenarios

| Test | Expected Result | Check |
|------|----------------|-------|
| Happy Path | Points credited | ☐ |
| Duplicate | Idempotent skip | ☐ |
| Stale Time | Rejected (replay) | ☐ |
| Bad Sig | Rejected + alert | ☐ |
| Unmapped | Rejected | ☐ |

## Performance Target
**p95 < 250ms** ✅

## Key URLs
- [Dashboard](https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906)
- [Alerts](https://console.cloud.google.com/monitoring/alerting/policies?project=walduae-project-20250809071906)
- [Logs](https://console.cloud.google.com/logs?project=walduae-project-20250809071906)
- [Metrics](https://console.cloud.google.com/logs/metrics?project=walduae-project-20250809071906)

## Success = All True
- ☐ Zero client writes
- ☐ Dashboard has data
- ☐ Alerts created
- ☐ Tests pass
- ☐ p95 < 250ms
- ☐ Screenshots taken

**Phase 1 Complete**: ☐

