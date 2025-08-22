# 📋 Alert Policy Builder - Quick Reference

## 🔧 Key Settings for Each Alert

### A) Failure Rate > 1%
```
Primary: paynow_webhook_requests (rate, sum)
Secondary: Arithmetic division with paynow_webhook_failures
Threshold: > 0.01 for 5 min
```

### B) No Requests (Endpoint Down Proxy)
```
Metric: paynow_webhook_requests
Transform: rate, sum
Threshold: < 0.000001 for 15 min
```

### C) p95 Latency > 5s
```
Metric: paynow_webhook_latency (DISTRIBUTION)
Transform: percentile(95), max
Threshold: > 5000 ms for 5 min
```

### D) Any Failures
```
Metric: paynow_webhook_failures
Transform: sum, sum
Threshold: > 0 for 1 min
```

### E) No Credits
```
Metric: paynow_points_credited
Transform: rate, sum
Threshold: < 0.000001 for 30 min
```

---

## 💡 Builder UI Tips

1. **Always use Builder mode** (not MQL/Code editor)
2. **Rolling window**: Always 1 min
3. **"Is below 0.000001"** = effectively zero
4. **Test with short windows** (1-2 min), then restore

---

## 🎯 Common Issues

**"Metric not found"**
- Wait 2-3 minutes after creating
- Refresh the page
- Try typing the full path: `logging/user/paynow_webhook_latency`

**"No data available"**
- Run a test webhook first
- Check the log filter matches your logs
- Verify metric is ingesting in Logs-based metrics page

**Alert not firing**
- Check notification channel is attached
- Verify threshold values
- Use shorter time windows for testing

---

## 📊 Dashboard Import Fix

**WRONG**: Monitoring → Dashboards → Import Grafana
**RIGHT**: Monitoring → Dashboards → Create custom → ⋮ → Import JSON
