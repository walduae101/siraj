# Architecture Decision Record: PayNow Webhook Integration

**Date:** December 21, 2024  
**Status:** Implemented  
**Context:** Siraj Points System Integration with PayNow  

## Decision

We have implemented a secure, idempotent webhook handler for PayNow payment events to ensure reliable point crediting for purchases and subscriptions.

## Context

The system was experiencing issues where successful payments were not resulting in credited points to user wallets. Investigation revealed:
- PayNow was sending webhook events but receiving 401 errors
- Signature verification was using incorrect encoding (hex instead of base64)
- Header names were incorrect (using capitalized instead of lowercase)
- No idempotency protection existed
- User documents weren't guaranteed to exist before wallet operations

## Decision Details

### 1. Webhook Verification Approach

**Implementation:**
- Use base64 encoding for HMAC-SHA256 signatures
- Read headers as lowercase: `paynow-signature`, `paynow-timestamp`
- Construct payload as `${timestamp}.${rawBody}` per PayNow specification
- Use constant-time comparison (`crypto.timingSafeEqual`)
- Reject timestamps older than 5 minutes for replay protection

```typescript
const payload = `${ts}.${reqBody}`;
const mac = crypto.createHmac("sha256", webhookSecret).update(payload).digest("base64");
return crypto.timingSafeEqual(Buffer.from(mac, "base64"), Buffer.from(sig, "base64"));
```

### 2. Idempotency Key Strategy

**Implementation:**
- Use event ID from PayNow when available
- Fallback to deterministic key: `${eventType}_${timestamp}_${entityId}_${amount}`
- Store in `webhookEvents/{eventId}` collection with status tracking
- Skip processing if event already exists in "processed" or "skipped" state

**Benefits:**
- Prevents duplicate point crediting
- Allows safe webhook retries
- Provides audit trail

### 3. Firestore Schema

**Collections:**

#### `users/{uid}`
- Base document for all users
- Fields: `uid`, `email`, `displayName`, `createdAt`, `updatedAt`, `status`, `paynowCustomerId`
- Created proactively before any wallet operations

#### `users/{uid}/wallet/points`
- Single document tracking point balances
- Fields: `paid`, `promo`, `updatedAt`
- Updated via transactions only

#### `users/{uid}/ledger/{entryId}`
- Immutable transaction history
- Fields: `delta`, `type`, `source`, `orderId`, `productId`, `quantity`, `createdAt`
- One entry per credit/debit operation

#### `users/{uid}/subscriptions/{subId}`
- Active subscription tracking
- Fields: `productId`, `planName`, `status`, `activatedAt`, `nextCreditAt`, `lastCreditedAt`

#### `webhookEvents/{eventId}`
- Webhook processing tracking
- Fields: `eventType`, `status`, `receivedAt`, `processedAt`, `error`
- Status values: "received", "processed", "skipped", "error"

#### `paynowCustomers/{customerId}`
- PayNow customer to Firebase user mapping
- Fields: `uid`, `email`, `createdAt`, `updatedAt`

#### `userMappings/{uid}`
- Reverse mapping for email lookups
- Fields: `paynowCustomerId`, `email`, `createdAt`, `updatedAt`

**Composite Indexes:**
```json
{
  "collectionGroup": "subscriptions",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "nextCreditAt", "order": "ASCENDING" }
  ]
}
```

### 4. User Resolution Strategy

Layered approach to map PayNow customers to Firebase users:

1. **Primary:** Check customer metadata for `uid` field
2. **Secondary:** Look up `paynowCustomers/{customerId}` mapping
3. **Tertiary:** Email-based lookup with retroactive mapping creation

### 5. Event Processing

**Supported Events:**
- `ON_ORDER_COMPLETED` - Credit points for one-time purchases
- `ON_DELIVERY_ITEM_ADDED` - Alternative crediting path
- `ON_SUBSCRIPTION_ACTIVATED` - Create subscription record, credit first cycle
- `ON_SUBSCRIPTION_RENEWED` - Credit monthly points
- `ON_SUBSCRIPTION_CANCELED` / `ON_SUBSCRIPTION_EXPIRED` - Update status

**Processing Flow:**
1. Verify signature and timestamp
2. Check idempotency (skip if already processed)
3. Parse event and resolve user
4. Ensure user document exists
5. Execute business logic in transaction
6. Update webhook event status

## Consequences

### Positive
- Webhook failures resolved - proper signature verification implemented
- Zero duplicate credits - idempotency protection in place
- Better observability - comprehensive logging and status tracking
- Improved reliability - user documents always exist before operations
- Future-proof - supports multiple event types and user mapping strategies

### Negative
- Slight latency increase - additional database checks for idempotency
- More complex codebase - multiple collections and mappings to maintain

### Neutral
- Requires ongoing monitoring of webhook health
- PayNow dashboard must be configured with correct webhook URL and events

## Security Considerations

1. **Secrets Management:** All sensitive values stored in Google Secret Manager
2. **Replay Protection:** 5-minute timestamp window prevents replay attacks
3. **Access Control:** Webhook collections are server-only (no client access)
4. **Validation:** Strict event validation before processing

## Monitoring

Key metrics to track:
- Webhook response codes (401s indicate signature issues)
- Processing delays (time between receipt and processing)
- Failed user mappings (indicates missing customer data)
- Credit success rate per event type

## References

- [PayNow Webhook Integration](https://docs.paynow.gg/webhooks/integration-implementation-examples)
- [PayNow Event Types](https://docs.paynow.gg/webhooks/events)
- Implementation: `src/app/api/paynow/webhook/route.ts`
- Test Suite: `tools/test-paynow-webhook.ts`
