# Phase 1 - Metrics Fix Commands

## 🔧 Fix Required: Update to Structured Log Metrics

### Step 1: Delete Old HTTP-Based Metrics
```bash
# Delete outdated metrics
gcloud logging metrics delete paynow_webhook_failures --quiet
gcloud logging metrics delete paynow_webhook_requests --quiet
```

### Step 2: Create New Structured Log Metrics

#### Metric 1: Webhook Requests
```bash
gcloud logging metrics create paynow_webhook_requests `
  --description="Count of PayNow webhook requests received" `
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook received"' `
  --metric-kind=DELTA
```

#### Metric 2: Webhook Failures  
```bash
gcloud logging metrics create paynow_webhook_failures `
  --description="Count of failed PayNow webhook processing" `
  --log-filter='jsonPayload.component="paynow_webhook" AND (jsonPayload.severity="ERROR" OR jsonPayload.severity="WARNING")' `
  --metric-kind=DELTA
```

#### Metric 3: Points Credited
```bash
gcloud logging metrics create paynow_points_credited `
  --description="Sum of points credited through PayNow webhooks" `
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.message="Webhook processed successfully" AND jsonPayload.points>0' `
  --value-extractor="EXTRACT(jsonPayload.points)" `
  --metric-kind=DELTA
```

#### Metric 4: Webhook Latency
```bash
gcloud logging metrics create paynow_webhook_latency `
  --description="Processing time for PayNow webhooks in milliseconds" `
  --log-filter='jsonPayload.component="paynow_webhook" AND jsonPayload.processing_ms>0' `
  --value-extractor="EXTRACT(jsonPayload.processing_ms)" `
  --metric-kind=DELTA
```

### Step 3: Verify Metrics Created
```bash
# List all PayNow metrics
gcloud logging metrics list --filter="name:paynow" --format="table(name,description)"
```

### Step 4: Import Dashboard
1. Go to: https://console.cloud.google.com/monitoring/dashboards?project=walduae-project-20250809071906
2. Click "Create Dashboard" → "Upload"
3. Select: `monitoring/paynow-webhook-dashboard.json`
4. Click "Load" → "Create"

---

## ⏱️ Estimated Time: 5-10 minutes

**Note**: Metrics will start populating after test traffic is sent.
