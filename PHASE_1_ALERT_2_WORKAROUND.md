# Alert #2 Workaround - No Credits for 30 min

## 🔧 Alternative Approaches

### Option A: Try Different Search Terms
1. In the metric search box, try:
   - `points_credited`
   - `credited`
   - `paynow`
   - Just type `logging/user/` and browse the list

### Option B: Create from Logs Explorer
1. Cancel current alert creation
2. Go to **Logs Explorer**: https://console.cloud.google.com/logs/query?project=walduae-project-20250809071906
3. Enter this query:
   ```
   jsonPayload.component="paynow_webhook"
   jsonPayload.message="Webhook processed successfully"
   jsonPayload.points>0
   ```
4. Click **Create alert** button above the query results
5. Configure as:
   - **Alert name**: `PayNow Webhook - No Credits`
   - **Log entries**: Check for absence
   - **Time between notifications**: 30 minutes
   - **Notification channel**: PayNow Webhook Alerts

### Option C: Use Direct Metric Path
1. In the current metric selector, look for:
   - **Resource type**: Cloud Run Revision
   - **Metric**: Look under "Logs-based metrics" section
   - Sometimes it's under: `logging.googleapis.com/user/paynow_points_credited`

### Option D: Create Simple Points Alert
1. Instead of metric absence, create a threshold alert:
   - Select `paynow_webhook_requests` (which is showing)
   - Set threshold < 0.1 (essentially zero)
   - For 30 minutes
   - This achieves similar monitoring

### Option E: Wait and Retry
- New metrics sometimes take 5-10 minutes to appear in the UI
- Try refreshing the page or logging out/in

---

## 🎯 Quick Alternative Alert Config

If you can't find the metric, use this simpler approach:

1. **Create log-based alert** (Option B above)
2. **Name**: `PayNow Webhook - No Credits`
3. **Condition**: Log absence for 30 minutes
4. **Notification**: PayNow Webhook Alerts

This achieves the same monitoring goal!

---

## 📝 Note
The metric definitely exists (confirmed via CLI). This is likely a UI indexing delay. Try:
1. Clearing browser cache
2. Using incognito/private mode
3. Waiting 5 minutes
