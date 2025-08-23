# Reconciliation Design

**Component**: Automated Wallet Reconciliation System  
**Purpose**: Guarantee wallet correctness end-to-end with self-healing capabilities

---

## Core Invariant

The fundamental invariant that must always hold:

```
wallet.points === sum(ledger.amount)
```

Where:
- `wallet.points` = Current wallet balance from `users/{uid}/wallet/points.paidBalance`
- `ledger.amount` = Sum of all amounts from `users/{uid}/ledger/{ledgerId}.amount`

---

## Algorithm Design

### 1. Invariant Computation

```typescript
async function computeWalletInvariant(uid: string) {
  // Get current wallet balance
  const wallet = await getWallet(uid);
  const walletBalance = wallet?.paidBalance || 0;
  
  // Sum all ledger entries
  const ledgerEntries = await getLedgerEntries(uid);
  const ledgerSum = ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0);
  
  // Calculate delta
  const delta = walletBalance - ledgerSum;
  
  return {
    walletBalance,
    ledgerSum,
    ledgerCount: ledgerEntries.length,
    delta
  };
}
```

### 2. Drift Detection

A drift is detected when:
```typescript
const hasDrift = Math.abs(delta) >= 0.01; // 1 cent tolerance
```

**Tolerance Rationale**:
- Floating-point precision errors in financial calculations
- Rounding differences between systems
- 1 cent tolerance prevents false positives from micro-adjustments

### 3. Self-Healing Process

When drift is detected:

```typescript
async function healDrift(uid: string, delta: number, reportId: string) {
  await db.runTransaction(async (transaction) => {
    // 1. Update wallet balance
    const walletRef = getWalletRef(uid);
    const walletDoc = await transaction.get(walletRef);
    const currentBalance = walletDoc.data()?.paidBalance || 0;
    const newBalance = currentBalance + delta;
    
    transaction.update(walletRef, {
      paidBalance: newBalance,
      updatedAt: Timestamp.now()
    });
    
    // 2. Create reconciliation adjustment entry
    const ledgerRef = getLedgerRef(uid);
    transaction.set(ledgerRef, {
      amount: delta,
      balanceAfter: newBalance,
      currency: "POINTS",
      kind: "reconcile_adjustment",
      source: {
        reason: `Reconciliation adjustment: ${delta > 0 ? 'credit' : 'debit'} ${Math.abs(delta)} points`,
        reportId
      },
      createdAt: Timestamp.now(),
      createdBy: "system:reconciliation"
    });
  });
}
```

---

## Data Structures

### Reconciliation Report

```typescript
interface ReconciliationReport {
  id: string;                    // `${date}_${uid}`
  uid: string;                   // User ID
  date: string;                  // YYYY-MM-DD format
  walletBefore: number;          // Balance before adjustment
  walletAfter: number;           // Balance after adjustment
  ledgerSum: number;             // Sum of all ledger entries
  delta: number;                 // Difference (wallet - ledger)
  ledgerCount: number;           // Number of ledger entries
  status: "clean" | "adjusted" | "error";
  error?: string;                // Error message if failed
  createdAt: Timestamp;          // When report was created
  checksum: string;              // Data integrity check
}
```

### Reconciliation Adjustment Entry

```typescript
interface ReconciliationAdjustment {
  amount: number;                // The delta to apply
  reason: string;                // Human-readable reason
  source: "recon";               // Source identifier
  reportId: string;              // Link to reconciliation report
}
```

---

## Performance Considerations

### Collection Group Queries

The reconciliation system uses collection group queries to efficiently scan all ledger entries:

```typescript
const ledgerSnapshot = await db
  .collectionGroup("ledger")
  .where("__name__", ">=", `users/${uid}/ledger/`)
  .where("__name__", "<", `users/${uid}/ledger/\uf8ff`)
  .get();
```

**Index Requirements**:
- `ledger` collection group on `__name__` and `createdAt`
- Enables efficient user-specific ledger scanning

### Batch Processing

For daily reconciliation of all users:

```typescript
async function reconcileAllUsers(date: string) {
  // Get all users with wallets
  const walletSnapshot = await db
    .collectionGroup("wallet")
    .where("__name__", "==", "points")
    .get();
  
  const results = {
    total: 0,
    clean: 0,
    adjusted: 0,
    errors: 0,
    totalDelta: 0
  };
  
  // Process each user
  for (const doc of walletSnapshot.docs) {
    const uid = doc.ref.parent.parent?.id;
    if (!uid) continue;
    
    const report = await reconcileUser(uid, date);
    // Update results based on report status
  }
  
  return results;
}
```

---

## Error Handling

### Graceful Degradation

1. **Individual User Failures**: Log error and continue with next user
2. **Partial Failures**: Track error count and report in summary
3. **Complete Failures**: Mark migration as failed, retry with exponential backoff

### Error Recovery

```typescript
try {
  const report = await reconcileUser(uid, date);
  // Process successful reconciliation
} catch (error) {
  // Create error report
  const errorReport = {
    uid,
    date,
    status: "error",
    error: error.message,
    createdAt: Timestamp.now()
  };
  
  // Log structured error
  console.error("[reconciliation] User reconciliation failed", {
    component: "recon",
    uid,
    error: error.message,
    report_id: `${date}_${uid}`
  });
}
```

---

## Monitoring & Observability

### Key Metrics

1. **`wallet_invariant_violations`** (Counter)
   - Incremented for each user with drift detected
   - Alert threshold: > 0 in last 15 minutes

2. **`reconciliation_adjustment_amount`** (Sum)
   - Total absolute value of adjustments made
   - Alert threshold: > 1000 points/day

3. **`reconciliation_daily`** (Histogram)
   - Daily reconciliation summary with user counts
   - Tracks clean/adjusted/error distributions

### Structured Logging

```typescript
console.log("[reconciliation] User reconciled", {
  component: "recon",
  uid,
  delta,
  wallet_before: walletBalance,
  wallet_after: newBalance,
  ledger_count: ledgerCount,
  report_id: reportId,
  status
});
```

### Checksums

Data integrity verification:

```typescript
function computeChecksum(data: InvariantData): string {
  const str = `${data.walletBalance}|${data.ledgerSum}|${data.ledgerCount}|${data.delta}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}
```

---

## Security Considerations

### Access Control

- **Reconciliation Reports**: Admin-only read access
- **Ledger Writes**: Server-only (via Admin SDK)
- **Job Endpoints**: OIDC authentication required

### Audit Trail

- **Immutable Adjustments**: All reconciliation adjustments create new ledger entries
- **Complete History**: Full audit trail of all reconciliation operations
- **Checksums**: Data integrity verification for reports

### Rate Limiting

- **Daily Job**: Once per day via Cloud Scheduler
- **Manual Triggers**: Rate limited to prevent abuse
- **Batch Size**: Limited to prevent resource exhaustion

---

## Testing Strategy

### Unit Tests

1. **Invariant Computation**: Test with known wallet/ledger combinations
2. **Drift Detection**: Test tolerance boundaries
3. **Self-Healing**: Test adjustment creation and wallet updates

### Integration Tests

1. **End-to-End Reconciliation**: Test complete reconciliation flow
2. **Error Handling**: Test with corrupted data and network failures
3. **Performance**: Test with large ledger volumes

### Manual Testing

1. **Synthetic Drift**: Create test users with known wallet/ledger mismatches
2. **Reconciliation Execution**: Run reconciliation and verify adjustments
3. **Report Verification**: Check reconciliation reports and checksums

---

## Rollback Strategy

### Immediate Rollback

```typescript
// Disable reconciliation via feature flag
RECONCILIATION_ENABLED = false;
```

### Adjustment Reversal

```typescript
// Use admin panel to reverse reconciliation adjustments
await createAdminAdjustment(uid, -adjustmentAmount, "Reversal of reconciliation adjustment");
```

### Full Restore

1. **From Backup**: Restore Firestore from backup before reconciliation
2. **Manual Correction**: Use admin panel to correct wallet balances
3. **Ledger Cleanup**: Remove reconciliation adjustment entries

---

## Future Enhancements

### Proactive Drift Prevention

1. **Real-time Monitoring**: Detect drift as it occurs
2. **Predictive Analysis**: Identify patterns that lead to drift
3. **Automated Prevention**: Prevent drift before it occurs

### Advanced Analytics

1. **Drift Patterns**: Analyze common causes of wallet/ledger mismatches
2. **Performance Optimization**: Optimize reconciliation performance
3. **Predictive Maintenance**: Predict when reconciliation will be needed

### Multi-Region Support

1. **Geographic Distribution**: Support multiple regions
2. **Cross-Region Reconciliation**: Reconcile across regions
3. **Disaster Recovery**: Regional failover capabilities
