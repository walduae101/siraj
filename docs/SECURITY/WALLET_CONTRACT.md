# Wallet Security Contract

**Updated on: 2025-01-10**

---

## Overview

This document defines the canonical wallet structure and security boundaries for the Siraj.life points system. **ALL services MUST follow this contract** to prevent security vulnerabilities and data corruption.

---

## Canonical Paths (REQUIRED)

### User Document
```
users/{uid}
```
- **Purpose**: Root user document with profile and status
- **Required Fields**:
  - `uid: string` - User identifier
  - `createdAt: Timestamp` - Account creation time
  - `updatedAt: Timestamp` - Last modification
  - `status: "active" | "suspended" | "deleted"` - Account status

### Wallet Document  
```
users/{uid}/wallet/points
```
- **Purpose**: User's points balance and wallet state
- **Required Fields**:
  - `paidBalance: number` - Points purchased with real money (never expires)
  - `promoBalance: number` - Promotional points with expiry dates
  - `promoLots: PromoLot[]` - Array of promotional point batches
  - `createdAt: Timestamp` - Wallet creation time
  - `updatedAt: Timestamp` - Last balance modification
  - `v: number` - Schema version (currently 1)

### Transaction Ledger
```
users/{uid}/ledger/{entryId}
```
- **Purpose**: Immutable transaction history for audit trails
- **Required Fields**:
  - `type: "credit" | "spend"` - Transaction type
  - `channel: "paid" | "promo"` - Points type affected
  - `amount: number` - Points changed (positive for credit, negative for spend)
  - `action: string` - Action identifier (e.g., "credit.paynow")
  - `actionId: string` - Idempotency key (unique per transaction)
  - `pre: {paid: number, promo: number}` - Balance before transaction
  - `post: {paid: number, promo: number}` - Balance after transaction
  - `createdAt: Timestamp` - Transaction timestamp
  - `createdBy: string` - System or user identifier
  - `v: number` - Schema version

---

## FORBIDDEN Paths ⛔

### Legacy Paths (DO NOT USE)
```
userPoints/{uid}              ❌ DEPRECATED - Security risk
users/{uid}/points            ❌ Wrong location  
points/{uid}                  ❌ Wrong collection structure
wallet/{uid}                  ❌ Wrong hierarchy
```

**These paths represent security vulnerabilities and MUST NOT be used.**

---

## Security Rules

### 1. Server-Only Write Operations
```javascript
// Firestore Security Rules
match /users/{uid}/wallet/{document=**} {
  allow read: if isSelf(uid);
  allow write: if false; // server-only - all credits MUST go through webhooks
}

match /users/{uid}/ledger/{txId} {
  allow read: if isSelf(uid);
  allow write: if false; // server-only
}
```

### 2. Client Application Restrictions
**NEVER ALLOW**:
- Direct wallet balance modifications from client code
- Point crediting from browser/mobile apps
- Ledger entry creation from frontend
- Bypassing server-side validation

**ALLOWED**:
- Reading wallet balance for display
- Real-time listening to wallet changes
- Viewing transaction history
- Triggering server-side point operations via authenticated APIs

### 3. API Boundaries
```typescript
// ✅ CORRECT: Server-side point crediting
await pointsService.credit({
  uid: "user123",
  kind: "paid",
  amount: 100,
  source: "paynow:webhook",
  actionId: "order_123"
});

// ❌ FORBIDDEN: Direct Firestore writes
await db.collection("users").doc(uid).update({ points: 100 });
await db.collection("userPoints").doc(uid).set({ points: 100 });
```

---

## Enforcement Mechanisms

### 1. Code Review Requirements
- Check for forbidden path usage in all PRs
- Verify server-side APIs for point operations
- Validate Firestore security rules compliance

### 2. Automated Checks
```bash
# CI/CD pipeline checks
grep -r "userPoints" src/ && exit 1
grep -r "\.set.*wallet" src/app/ && exit 1
grep -r "\.update.*points" src/app/ && exit 1
```

### 3. Runtime Monitoring
- Alert on unexpected collection writes
- Monitor for direct wallet modifications
- Track API usage patterns

---

## Migration Notes

### From Legacy userPoints
If legacy data exists:
1. Use `tools/fix-misplaced-points.ts` migration script
2. Verify data integrity after migration  
3. Create audit trail in ledger
4. Delete legacy documents only after confirmation

### Schema Evolution
- Version field (`v`) tracks schema changes
- Backward compatibility maintained during transitions
- Migration scripts preserve transaction history

---

## Points Service API

### Recommended Methods
```typescript
// Get current wallet state
const wallet = await pointsService.getWallet(uid);

// Credit points (server-side only)
await pointsService.credit({
  uid,
  kind: "paid" | "promo",
  amount: number,
  source: string,
  actionId: string, // idempotency key
  expiresAt?: Date  // for promo points only
});

// Spend points with validation
await pointsService.spend({
  uid,
  cost: number,
  action: string,
  actionId: string
});

// Preview spend without commitment
const preview = await pointsService.previewSpend({uid, cost});
```

### Transaction Safety
- All balance modifications use Firestore transactions
- Idempotency enforced via actionId
- Concurrent operations properly serialized
- Ledger entries created atomically with balance changes

---

## Audit & Compliance

### Required Audit Trails
1. **All point credits** logged with source and timestamp
2. **All point spends** logged with reason and remaining balance
3. **User actions** tracked with authentication context
4. **System operations** identified with service account

### Data Retention
- **Wallet documents**: Permanent (user lifetime)
- **Ledger entries**: Permanent (regulatory requirement)
- **Webhook events**: 30-day TTL (operational logs)

### Privacy Considerations
- User wallet data accessible only to account owner
- Ledger history available for user download
- Admin access logged and audited
- PII minimized in operational logs

---

## Version History

- **v1.0** (2025-01-10): Initial wallet contract definition
- Security boundaries established
- Canonical paths documented
- Enforcement mechanisms defined

---

## Compliance Statement

This contract ensures:
- **Financial Accuracy**: No duplicate credits or unauthorized modifications
- **Security**: Server-only write operations with proper authentication
- **Auditability**: Complete transaction history with immutable ledger
- **Regulatory**: Proper data retention and user access controls

**All development teams must acknowledge and follow this contract.**
