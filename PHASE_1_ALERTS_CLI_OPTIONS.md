# 🚀 Phase 1 - Alert Creation Options

## Current Status
- ✅ Dashboard imported successfully
- ✅ All metrics created with correct types
- ⏳ Need to create 5 alert policies

---

## Option A: Install Alpha Component (Recommended)

The gcloud CLI requires the `alpha` component for monitoring policies. To install:

```powershell
# Run PowerShell as Administrator
gcloud components install alpha
```

Then run:
```powershell
.\create-alerts-gcloud.ps1
```

**Note**: If you can't install components due to permissions, try Option B or C.

---

## Option B: Use Cloud Shell (No Installation Required)

1. Open Cloud Shell: https://console.cloud.google.com/cloudshell?project=walduae-project-20250809071906
2. Upload `create-alerts-gcloud.sh` to Cloud Shell
3. Run:
   ```bash
   chmod +x create-alerts-gcloud.sh
   ./create-alerts-gcloud.sh
   ```

Cloud Shell has all components pre-installed!

---

## Option C: Manual Creation with Pre-filled Values

I've prepared exact values for the UI Builder:

### Alert 1: High Failure Rate > 1%
- **Metric 1**: `paynow_webhook_requests` → rate → sum
- **Metric 2**: `paynow_webhook_failures` → rate → sum  
- **Math**: Metric 2 ÷ Metric 1
- **Threshold**: > 0.01 for 5 min

### Alert 2: No Requests
- **Metric**: `paynow_webhook_requests` → rate → sum
- **Threshold**: < 0.000001 for 15 min

### Alert 3: p95 Latency
- **Metric**: `paynow_webhook_latency` → percentile(95) → max
- **Threshold**: > 5000 for 5 min

### Alert 4: Any Failures
- **Metric**: `paynow_webhook_failures` → sum → sum
- **Threshold**: > 0 for 1 min

### Alert 5: No Credits
- **Metric**: `paynow_points_credited` → rate → sum
- **Threshold**: < 0.000001 for 30 min

---

## Option D: Use REST API (Alternative)

```powershell
# Get auth token
$token = gcloud auth print-access-token

# Create alerts using REST API
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

# POST to monitoring API...
```

---

## 🎯 Recommendation

**Try Option B (Cloud Shell)** - It's the quickest and has everything pre-installed. The script is ready to run and will create all 5 alerts in under a minute.

Which option would you prefer?
