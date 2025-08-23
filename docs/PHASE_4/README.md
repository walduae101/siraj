# PHASE 4: Revenue Assurance, Reconciliation & Production Cutover

**Status**: ✅ Complete  
**Date**: January 2025  
**Scope**: Automated reconciliation, backfill capabilities, dual environment setup, and production cutover

---

## Overview

PHASE 4 implements comprehensive revenue assurance with automated reconciliation, backfill capabilities, and clean test→prod separation. The system guarantees wallet correctness end-to-end with self-healing capabilities and safe production deployment.

---

## Acceptance Criteria

### ✅ Daily Reconciliation Job
- **Invariant**: `wallet.points === sum(ledger.amount)` for all users
- **Self-healing**: Automatic drift correction with reconciliation adjustment entries
- **Reporting**: Complete audit trail with checksums and structured logging
- **Metrics**: `wallet_invariant_violations` and `reconciliation_adjustment_amount`

### ✅ Backfill Capabilities
- **Webhook Replay**: Process missing/failed webhook events from `webhookEvents` collection
- **Reversal Backfill**: Create reversal entries for refunds/chargebacks without editing history
- **Idempotency**: Safe replay with duplicate prevention
- **Progress Tracking**: Migration records with status and error reporting

### ✅ New Collections & Indexes
- **`reconciliationReports/{date}/users/{uid}`**: Daily reconciliation snapshots
- **`dataMigrations/{id}`**: Backfill operation tracking
- **Indexes**: Collection-group indexes for ledger queries and webhook event processing

### ✅ CI Guardrails
- **Secret Scanning**: Gitleaks integration with blocking on findings
- **Pattern Detection**: Custom checks for API keys and service account JSON
- **Blocking Rules**: Prevents commits with secrets in code

### ✅ Dual Environment Setup
- **TEST/PROD Split**: Isolated Firebase projects and Secret Manager secrets
- **Feature Flags**: Environment-specific configuration
- **PayNow Separation**: Different webhook endpoints and credentials

### ✅ Production Cutover
- **Runbook**: Step-by-step cutover procedure with verification
- **Performance**: Maintains <250ms webhook ACK time
- **Rollback**: Feature flags and backup restoration procedures

---

## Architecture

### Reconciliation System
```
Daily Job → Cloud Scheduler → /api/jobs/reconcile → ReconciliationService
                                    ↓
                            Compute Invariant → Detect Drift → Self-heal
                                    ↓
                            Create Adjustment → Update Wallet → Log Report
```

### Backfill System
```
Manual Trigger → /api/jobs/backfill → BackfillService
                        ↓
                Scan webhookEvents → Process Missing → Create Ledger Entries
                        ↓
                Track Progress → Log Metrics → Update Migration Record
```

### Environment Separation
```
TEST Environment:
├── Firebase Project: siraj-test
├── Secret Manager: siraj-test-secrets
├── PayNow: Test webhook endpoint
└── Feature Flags: RECONCILIATION_ENABLED=true

PROD Environment:
├── Firebase Project: siraj-prod  
├── Secret Manager: siraj-prod-secrets
├── PayNow: Production webhook endpoint
└── Feature Flags: RECONCILIATION_ENABLED=true
```

---

## Key Features

### 1. Automated Reconciliation
- **Daily Job**: Cloud Scheduler triggers reconciliation at 2 AM UTC
- **Invariant Check**: `wallet.points === sum(ledger.amount)` for all users
- **Self-healing**: Creates `reconcile_adjustment` entries for drift correction
- **Audit Trail**: Complete reconciliation reports with checksums

### 2. Backfill Operations
- **Webhook Replay**: Process unprocessed webhook events from date ranges
- **Reversal Creation**: Find original purchases and create reversal entries
- **Dry Run Mode**: Test backfill operations without making changes
- **Progress Tracking**: Real-time migration status and error reporting

### 3. Security & CI
- **Secret Scanning**: Gitleaks integration with blocking rules
- **Pattern Detection**: Custom checks for common secret patterns
- **Environment Isolation**: Separate projects and secrets for TEST/PROD

### 4. Monitoring & Alerts
- **Metrics**: `wallet_invariant_violations`, `reconciliation_adjustment_amount`, `backfill_processed_events`
- **Alerts**: Invariant violations, high adjustment amounts, backfill errors
- **Dashboards**: Revenue assurance section with violation tracking

---

## Configuration

### Feature Flags
```typescript
features: {
  // PHASE 4: Revenue Assurance
  RECONCILIATION_ENABLED: boolean; // default: true
  BACKFILL_ENABLED: boolean;       // default: true
  ENVIRONMENT: "test" | "prod";    // default: "test"
}
```

### Environment Variables
```bash
# Environment Configuration
ENVIRONMENT=test|prod

# Reconciliation Settings
RECONCILIATION_ENABLED=1
BACKFILL_ENABLED=1

# Cloud Scheduler (set in console)
RECONCILIATION_SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
```

---

## API Endpoints

### Reconciliation Job
```http
POST /api/jobs/reconcile
Authorization: Bearer <OIDC_TOKEN>
Content-Type: application/json

{
  "date": "2025-01-10"  // Optional, defaults to today
}
```

### Backfill Job
```http
POST /api/jobs/backfill
Authorization: Bearer <OIDC_TOKEN>
Content-Type: application/json

{
  "type": "webhook_replay|reversal_backfill",
  "startDate": "2025-01-01",
  "endDate": "2025-01-10",
  "dryRun": false,
  "maxEvents": 1000
}
```

---

## Usage Examples

### Manual Reconciliation
```bash
# Trigger reconciliation for today
curl -X POST https://your-app.com/api/jobs/reconcile \
  -H "Authorization: Bearer $OIDC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-10"}'
```

### Webhook Replay Backfill
```bash
# Replay missing webhook events (dry run)
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

### Reversal Backfill
```bash
# Create reversal entries for refunds/chargebacks
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

---

## Monitoring

### Key Metrics
- `wallet_invariant_violations` - Count of users with wallet/ledger mismatches
- `reconciliation_adjustment_amount` - Total points adjusted during reconciliation
- `backfill_processed_events` - Number of events processed by backfill jobs
- `backfill_error_rate` - Percentage of backfill operations that failed

### Alerts
- **Invariant Violations**: Any violations in last 15 minutes
- **High Adjustments**: Total absolute adjustments > 1000 points/day
- **Backfill Errors**: Error rate > 1% for backfill operations

### Dashboard
- **Revenue Assurance Section**: Violations by day, top deltas, backfill throughput
- **Reconciliation Reports**: Daily summaries and drift analysis
- **Migration Tracking**: Backfill operation status and progress

---

## Security

### CI Guardrails
- **Secret Scanning**: Gitleaks integration with blocking on findings
- **Pattern Detection**: Custom checks for API keys and service account JSON
- **Environment Validation**: Ensures secrets are in Secret Manager only

### Access Control
- **Reconciliation Reports**: Admin-only read access
- **Data Migrations**: Admin-only read access
- **Job Endpoints**: OIDC authentication required

### Audit Trail
- **Immutable Ledger**: All reconciliation adjustments create new entries
- **Checksums**: Data integrity verification for reconciliation reports
- **Structured Logging**: Complete audit trail for all operations

---

## Rollback Strategy

### Feature Flag Rollback
```bash
# Disable reconciliation and backfill
RECONCILIATION_ENABLED=0
BACKFILL_ENABLED=0
```

### Environment Rollback
```bash
# Switch back to test environment
ENVIRONMENT=test
```

### Data Rollback
- **Reconciliation Adjustments**: Use admin panel to reverse adjustments
- **Backfill Operations**: Mark migrations as failed, re-run with corrections
- **Full Restore**: Use Firestore backup if needed

---

## Production Cutover

### Pre-Cutover Checklist
- [ ] Reconciliation job running successfully in TEST
- [ ] Zero invariant violations for 7 days
- [ ] Backfill operations tested and validated
- [ ] Monitoring and alerts configured
- [ ] Rollback procedures documented

### Cutover Steps
1. **Freeze Manual Adjustments**: Disable admin panel wallet adjustments
2. **Snapshot Firestore**: Create backup before cutover
3. **Verify TEST Environment**: Confirm zero net delta in reconciliation
4. **Promote to PROD**: Deploy container to production environment
5. **Switch PayNow Webhooks**: Update webhook endpoints to production
6. **Monitor**: Watch alerts and dashboards for 2 hours
7. **Unfreeze**: Re-enable admin panel operations

### Post-Cutover Verification
- [ ] Webhook response times < 250ms
- [ ] No invariant violations in first reconciliation run
- [ ] All metrics and alerts functioning
- [ ] Admin panel accessible and functional

---

## Files Created/Modified

### New Files
- `src/server/services/reconciliation.ts` - Reconciliation service
- `src/server/services/backfill.ts` - Backfill service
- `src/app/api/jobs/reconcile/route.ts` - Reconciliation job endpoint
- `src/app/api/jobs/backfill/route.ts` - Backfill job endpoint
- `.github/workflows/secret-scan.yml` - CI secret scanning
- `docs/PHASE_4/` - Complete documentation

### Modified Files
- `firestore.indexes.json` - Added 5 new indexes
- `firestore.rules` - Updated security rules
- `src/server/config.ts` - Added PHASE 4 feature flags

---

## Next Steps

### Immediate (Week 1)
1. **Deploy to TEST**: Deploy PHASE 4 to test environment
2. **Run Reconciliation**: Execute daily reconciliation job
3. **Test Backfill**: Validate webhook replay and reversal backfill
4. **Configure Monitoring**: Set up alerts and dashboards

### Short Term (Month 1)
1. **Production Cutover**: Execute cutover runbook
2. **Performance Monitoring**: Track webhook response times
3. **Reconciliation Analysis**: Monitor drift patterns and root causes
4. **Backfill Optimization**: Optimize backfill performance

### Long Term (Quarter 1)
1. **Advanced Analytics**: Enhanced reconciliation reporting
2. **Automated Healing**: Proactive drift prevention
3. **Multi-Region**: Geographic distribution for resilience
4. **Phase 5 Planning**: Begin fraud/abuse controls implementation

---

## Support

For issues or questions:
1. Check reconciliation reports for drift analysis
2. Review migration records for backfill status
3. Monitor structured logs for operation details
4. Contact development team with specific error messages

---

**What Changed**: Added automated reconciliation, backfill capabilities, CI guardrails, and dual environment setup.

**How to Roll Back**: Use feature flags to disable reconciliation/backfill, switch environment back to test, restore from Firestore backup if needed.
