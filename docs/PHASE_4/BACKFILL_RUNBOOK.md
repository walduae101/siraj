# Backfill Runbook

**Purpose**: Guide for running webhook replay and reversal backfill operations  
**Audience**: DevOps engineers and system administrators

---

## Overview

The backfill system processes missing or failed webhook events and creates reversal entries for refunds/chargebacks. All operations are idempotent and safe to re-run.

---

## Prerequisites

### Authentication
- Valid OIDC token for job endpoint authentication
- Admin access to view migration records

### Environment Setup
- Backfill feature flag enabled: `BACKFILL_ENABLED=true`
- Access to Firestore collections: `webhookEvents`, `dataMigrations`

---

## Backfill Types

### 1. Webhook Replay
**Purpose**: Process unprocessed webhook events from `webhookEvents` collection  
**Use Case**: Missing ledger entries due to webhook processing failures

### 2. Reversal Backfill
**Purpose**: Create reversal entries for refund/chargeback events  
**Use Case**: Missing reversal entries for processed refunds/chargebacks

---

## Running Backfill Operations

### Manual Execution

#### Webhook Replay
```bash
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook_replay",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false,
    "maxEvents": 1000
  }'
```

#### Reversal Backfill
```bash
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reversal_backfill",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false,
    "maxEvents": 1000
  }'
```

### Dry Run Mode

Always test with dry run first:

```bash
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook_replay",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": true,
    "maxEvents": 100
  }'
```

**Dry Run Behavior**:
- Scans for unprocessed events
- Marks events as `dryRunProcessed: true`
- Does NOT create ledger entries
- Reports what would be processed

---

## Monitoring Backfill Operations

### Check Migration Status

```bash
# Get recent migrations
curl -X GET https://your-app.com/api/admin/dataMigrations \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get specific migration
curl -X GET https://your-app.com/api/admin/dataMigrations/{migrationId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Migration Status Values

- **`pending`**: Migration created, not yet started
- **`running`**: Currently processing events
- **`completed`**: Successfully finished
- **`failed`**: Encountered errors and stopped

### Structured Logs

Monitor logs for backfill operations:

```bash
# Filter logs for backfill operations
gcloud logging read 'resource.type="cloud_run_revision" AND 
  jsonPayload.component="backfill"' \
  --limit=50 --format="table(timestamp,jsonPayload)"
```

### Key Log Fields

```json
{
  "component": "backfill",
  "migration_id": "webhook_replay_1704844800000",
  "event_count": 150,
  "start_date": "2025-01-01",
  "end_date": "2025-01-10",
  "dry_run": false,
  "processed": 145,
  "errors": 5,
  "total": 150
}
```

---

## Common Scenarios

### Scenario 1: Missing Purchase Ledger Entries

**Symptoms**:
- Users report missing points from purchases
- Webhook events exist but no ledger entries
- Wallet balances don't match expected amounts

**Solution**:
```bash
# 1. Identify affected date range
# 2. Run dry run to assess scope
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook_replay",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": true,
    "maxEvents": 1000
  }'

# 3. If dry run shows issues, run actual backfill
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook_replay",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false,
    "maxEvents": 1000
  }'
```

### Scenario 2: Missing Refund Reversals

**Symptoms**:
- Refund events processed but no reversal ledger entries
- Users still have points after refunds
- Wallet balances incorrect after refunds

**Solution**:
```bash
# 1. Run reversal backfill for refund period
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reversal_backfill",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false,
    "maxEvents": 1000
  }'
```

### Scenario 3: Large Date Range Processing

**Symptoms**:
- Need to process many months of data
- Risk of timeout or resource exhaustion

**Solution**:
```bash
# 1. Break into smaller chunks
for month in "2024-11" "2024-12" "2025-01"; do
  echo "Processing $month..."
  
  curl -X POST https://your-app.com/api/jobs/backfill \
    -H "Authorization: Bearer $OIDC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"webhook_replay\",
      \"startDate\": \"$month-01\",
      \"endDate\": \"$month-31\",
      \"dryRun\": false,
      \"maxEvents\": 500
    }"
  
  # Wait between chunks
  sleep 30
done
```

---

## Troubleshooting

### Error: "Original purchase entry not found"

**Cause**: Refund/chargeback event references order that has no purchase ledger entry

**Solution**:
1. Check if purchase webhook event exists
2. Run webhook replay first to create missing purchase entries
3. Then run reversal backfill

```bash
# 1. Create missing purchase entries
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "webhook_replay",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false
  }'

# 2. Create reversal entries
curl -X POST https://your-app.com/api/jobs/backfill \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reversal_backfill",
    "startDate": "2025-01-01",
    "endDate": "2025-01-10",
    "dryRun": false
  }'
```

### Error: "Product not found"

**Cause**: Webhook event references PayNow product ID not in catalog

**Solution**:
1. Check product catalog for missing products
2. Add missing products via admin panel
3. Re-run backfill operation

### High Error Rate

**Symptoms**: Error rate > 1% in backfill operations

**Investigation**:
```bash
# Check error details in logs
gcloud logging read 'resource.type="cloud_run_revision" AND 
  jsonPayload.component="backfill" AND 
  severity>=ERROR' \
  --limit=20 --format="table(timestamp,jsonPayload.error)"
```

**Common Causes**:
- Missing products in catalog
- Corrupted webhook event data
- Network timeouts
- Firestore quota limits

---

## Performance Considerations

### Batch Size Limits

- **Default**: 1000 events per batch
- **Large Operations**: Reduce to 500 for stability
- **Very Large**: Process in smaller date chunks

### Rate Limiting

- **Concurrent Operations**: Limit to 2-3 concurrent backfills
- **Cooldown Period**: Wait 30 seconds between large operations
- **Resource Monitoring**: Monitor CPU and memory usage

### Optimization Tips

1. **Date Range Selection**: Use smallest possible date range
2. **Event Type Filtering**: Process specific event types if possible
3. **Dry Run First**: Always test with dry run to assess scope
4. **Monitor Progress**: Check migration status regularly

---

## Rollback Procedures

### Reversing Backfill Operations

**Note**: Backfill operations are generally safe and idempotent. Rollback is rarely needed.

#### Option 1: Reverse via Admin Panel
```bash
# Use admin panel to reverse specific ledger entries
# Navigate to /admin → User Search → Wallet → Manual Adjustment
```

#### Option 2: Mark Migration as Failed
```bash
# Update migration status to prevent re-processing
# This is handled automatically by the system
```

#### Option 3: Restore from Backup
```bash
# If major issues occur, restore from Firestore backup
# Contact development team for assistance
```

---

## Best Practices

### Before Running Backfill

1. **Verify Environment**: Ensure correct environment (test/prod)
2. **Check Feature Flags**: Confirm `BACKFILL_ENABLED=true`
3. **Dry Run First**: Always test with dry run
4. **Monitor Resources**: Check system capacity
5. **Notify Team**: Inform relevant stakeholders

### During Backfill

1. **Monitor Progress**: Check migration status regularly
2. **Watch Logs**: Monitor structured logs for errors
3. **Track Metrics**: Monitor `backfill_processed_events` and `backfill_error_rate`
4. **Be Patient**: Large operations may take time

### After Backfill

1. **Verify Results**: Check migration completion status
2. **Validate Data**: Spot-check wallet balances and ledger entries
3. **Update Documentation**: Record what was processed
4. **Monitor Alerts**: Watch for any post-backfill issues

---

## Emergency Procedures

### Stop Running Backfill

```bash
# Disable backfill feature flag
BACKFILL_ENABLED=false

# Restart application to apply changes
```

### Contact Support

If you encounter issues not covered in this runbook:

1. **Collect Logs**: Gather relevant structured logs
2. **Document Steps**: Record exact commands and responses
3. **Check Migration Status**: Note migration IDs and status
4. **Contact Development Team**: Provide detailed information

---

## Reference

### API Endpoints

- **Backfill Job**: `POST /api/jobs/backfill`
- **Migration Status**: `GET /api/admin/dataMigrations`

### Environment Variables

- `BACKFILL_ENABLED`: Enable/disable backfill operations
- `ENVIRONMENT`: Current environment (test/prod)

### Monitoring Metrics

- `backfill_processed_events`: Number of events processed
- `backfill_error_rate`: Percentage of failed operations
- `backfill_operation_duration`: Time taken for operations
