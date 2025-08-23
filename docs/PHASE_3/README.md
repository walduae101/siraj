# PHASE 3: Product SoT + Ledger & Reversals + Admin + Guardrails

**Status**: ✅ Complete  
**Date**: January 2025  
**Scope**: Product catalog migration, immutable ledger, admin panel, and security guardrails

---

## Overview

PHASE 3 implements a comprehensive upgrade to the PayNow webhook system with:

1. **Product Source of Truth**: Migrate from GSM to versioned Firestore catalog
2. **Immutable Wallet Ledger**: Transactional ledger with reversal support
3. **Admin Panel**: Internal management interface for wallet operations
4. **Security Guardrails**: Feature flags, validation, and audit trails

---

## Architecture Changes

### Before (PHASE 2)
```
PayNow Webhook → GSM Product Mapping → Points Service → Firestore
```

### After (PHASE 3)
```
PayNow Webhook → Firestore Product Catalog (SoT) → Wallet Ledger → Firestore
                ↓ (fallback)
                GSM Product Mapping
```

---

## New Collections

### `products/` (Top-level)
```typescript
{
  id: string;
  title: string;
  type: "one_time" | "subscription";
  points: number;
  priceUSD: number;
  paynowProductId: string;
  active: boolean;
  version: number;
  effectiveFrom?: Timestamp;
  effectiveTo?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  metadata?: Record<string, unknown>;
}
```

### `promotions/` (Top-level)
```typescript
{
  id: string;
  code: string;
  discountPercent?: number;
  bonusPoints?: number;
  appliesTo: string[] | "*";
  active: boolean;
  usageLimit: number;
  usageCount: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  terms: string;
}
```

### `users/{uid}/wallet/ledger/{ledgerId}`
```typescript
{
  id: string;
  amount: number; // positive=credit, negative=debit
  balanceAfter: number;
  currency: string; // "POINTS"
  kind: "purchase" | "subscription_renewal" | "refund" | "chargeback" | "admin_adjustment";
  source: {
    eventId?: string;
    orderId?: string;
    paynowCustomerId?: string;
    productId?: string;
    productVersion?: number;
    reversalOf?: string;
    reason?: string;
  };
  createdAt: Timestamp;
  createdBy: string;
}
```

---

## Key Features

### 1. Product Source of Truth
- **Firestore Catalog**: Versioned product definitions with metadata
- **GSM Fallback**: Automatic fallback for missing products
- **Feature Flag**: `PRODUCT_SOT=firestore|gsm` controls behavior
- **Migration Script**: One-time migration from GSM to Firestore

### 2. Immutable Wallet Ledger
- **Transactional Updates**: Balance and ledger updated atomically
- **Reversal Support**: Refunds/chargebacks create reversal entries
- **Audit Trail**: Complete history of all wallet operations
- **Negative Balance Control**: `ALLOW_NEGATIVE_BALANCE` feature flag

### 3. Admin Panel (`/admin`)
- **User Search**: Find users by email
- **Wallet Management**: View balance and transaction history
- **Manual Adjustments**: Credit/debit with required reason
- **Product Management**: View products and promotions
- **CSV Export**: Download ledger data for analysis

### 4. Refund/Chargeback Handling
- **Automatic Reversal**: Webhook events trigger ledger reversals
- **Original Entry Lookup**: Find purchase by order ID
- **Balance Protection**: Configurable negative balance handling
- **Audit Trail**: Complete reversal history

---

## Configuration

### Feature Flags
```typescript
features: {
  PRODUCT_SOT: "firestore" | "gsm"; // default: "firestore"
  ALLOW_NEGATIVE_BALANCE: boolean;   // default: true
}
```

### Environment Variables
```bash
# Product Source of Truth
PRODUCT_SOT=firestore

# Negative Balance Control
ALLOW_NEGATIVE_BALANCE=1

# Admin Access (set via Firebase custom claims)
# No environment variable - set via Firebase Admin SDK
```

---

## Migration Process

### 1. Pre-Migration
```bash
# Run migration script
pnpm tsx scripts/migrate-products-from-gsm.ts

# Verify products created
# Check Firestore console for products collection
```

### 2. Deployment
```bash
# Deploy with feature flags
PRODUCT_SOT=firestore ALLOW_NEGATIVE_BALANCE=1

# Monitor webhook logs for:
# - product_source: "firestore" | "gsm_fallback"
# - ledger_id: new structured field
# - product_version: version tracking
```

### 3. Post-Migration
```bash
# Run test scenarios
pnpm tsx scripts/test-phase3-scenarios.ts

# Verify admin panel access
# Test manual adjustments
# Export ledger data
```

---

## Security

### Admin Access
- **Firebase Custom Claims**: `admin: true` required
- **tRPC Middleware**: Validates admin claims on all admin routes
- **Firestore Rules**: Server-only writes, admin-only product/promotion writes

### Audit Trail
- **Immutable Ledger**: No updates/deletes after creation
- **Admin Actions**: All manual adjustments logged with reason
- **Reversal Tracking**: Complete chain of original → reversal entries

### Data Protection
- **Server-Only Writes**: All wallet operations via backend
- **Transaction Safety**: Atomic balance + ledger updates
- **Idempotency**: Duplicate events handled safely

---

## Monitoring

### Structured Logs
```json
{
  "event_id": "webhook_event_id",
  "user_id": "firebase_uid",
  "order_id": "paynow_order_id",
  "product_id": "paynow_product_id",
  "product_source": "firestore|gsm_fallback",
  "product_version": 1,
  "ledger_id": "firestore_ledger_id",
  "balance_after": 150,
  "points_credited": 50,
  "quantity": 1
}
```

### Metrics
- `paynow_ledger_reversals_count` - Counter for refunds/chargebacks
- `paynow_admin_adjustments_count` - Counter for manual adjustments

### Alerts
- Negative balance creation (if not allowed)
- GSM fallback usage (indicates missing products)
- Admin adjustment frequency

---

## Rollback Strategy

### Feature Flag Rollback
```bash
# Revert to GSM product mapping
PRODUCT_SOT=gsm

# Disable negative balances
ALLOW_NEGATIVE_BALANCE=0
```

### Data Rollback
- **Products**: Delete from Firestore, revert to GSM
- **Ledger**: Immutable - no rollback needed
- **Wallet**: Use admin panel to adjust balances

---

## Testing

### Automated Tests
```bash
# Run comprehensive test suite
pnpm tsx scripts/test-phase3-scenarios.ts
```

### Manual Testing
1. **Webhook Processing**: Test purchase → ledger creation
2. **Refund Handling**: Test refund → reversal creation
3. **Admin Panel**: Test user search, adjustments, exports
4. **Feature Flags**: Test GSM fallback behavior

---

## Files Changed

### New Files
- `src/server/services/productCatalog.ts` - Product catalog service
- `src/server/services/walletLedger.ts` - Wallet ledger service
- `src/server/api/routers/admin.ts` - Admin tRPC router
- `src/app/admin/page.tsx` - Admin UI
- `scripts/migrate-products-from-gsm.ts` - Migration script
- `scripts/test-phase3-scenarios.ts` - Test scenarios
- `docs/PHASE_3/` - Documentation

### Modified Files
- `firestore.indexes.json` - New indexes for products, promotions, ledger
- `firestore.rules` - Updated security rules
- `src/server/config.ts` - Added feature flags
- `src/app/api/paynow/webhook/route.ts` - Updated webhook logic
- `src/server/api/root.ts` - Added admin router

---

## Next Steps

1. **Deploy to Production**: Follow migration checklist
2. **Monitor Performance**: Watch webhook response times
3. **Admin Training**: Train operators on admin panel
4. **Documentation**: Update runbooks and procedures
5. **Phase 4 Planning**: Begin next phase planning

---

## Support

For issues or questions:
1. Check structured logs for error details
2. Run test scenarios to isolate problems
3. Review admin panel for data consistency
4. Contact development team with specific error messages
