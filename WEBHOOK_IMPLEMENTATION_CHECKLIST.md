# PayNow Webhook Implementation Checklist

Based on your comprehensive action plan, here's the status of each requirement:

## ✅ 1. Stop Client from Crediting Points
- **DONE**: Removed `checkout.complete` mutation dependency from success page
- **DONE**: Success page now uses Firestore real-time listener to watch `users/{uid}/wallet/points`
- **DONE**: Shows "Processing your payment..." while waiting for webhook

## ✅ 2. Webhook Security & Idempotency
- **DONE**: Signature verification using `paynow-timestamp` and `paynow-signature` headers
- **DONE**: HMAC-SHA256 with base64 encoding (not hex)
- **DONE**: Replay protection - 5 minute window
- **DONE**: Fast ACK - returns 200 immediately after basic validation
- **DONE**: Idempotency - checks `webhookEvents/{event_id}` before processing

## ✅ 3. Correct Firestore Path
- **DONE**: Writing to `users/{uid}/wallet/points` with numeric `paidBalance`
- **DONE**: `ensureUserDocument()` creates user and wallet before any writes
- **DONE**: No code writes to `userPoints` collection (verified with grep)

## ✅ 4. PayNow → User Mapping
Resolution order implemented:
1. **DONE**: Check `customer.metadata.uid` first
2. **DONE**: Lookup `paynowCustomers/{customerId}` mapping
3. **DONE**: Email match as last resort with mapping persistence

## ⚠️ 5. Product Mapping
- **PARTIAL**: Reading from Google Secret Manager config
- **TODO**: Missing product ID `321641745958305792` needs to be added
- **DONE**: Refuses to credit if product not in mapping

## ✅ 6. Event Handling
- **DONE**: Credits on `ON_ORDER_COMPLETED`
- **DONE**: Handles `ON_SUBSCRIPTION_ACTIVATED`, `ON_SUBSCRIPTION_RENEWED`
- **DONE**: Validates order object before crediting

## ✅ 7. Google Secret Manager
- **DONE**: All secrets in GSM (apiKey, webhookSecret, storeId, products)
- **DONE**: Mounted in Cloud Run via environment variable
- **DONE**: Service account has Secret Manager Secret Accessor role

## ✅ 8. Data Migration
- **DONE**: Created `tools/fix-misplaced-points.ts` migration script
- Converts string to numeric
- Creates proper ledger entries
- **TODO**: Run the migration to fix existing data

## ✅ 9. Observability
- **DONE**: Structured logging on webhook receipt
- **DONE**: Logs include: event_id, event_type, uid, product_id, points
- **DONE**: Created monitoring queries in `monitoring/webhook-health-queries.md`
- **DONE**: Log-based metrics created for webhook requests and failures

## 📁 Firestore Model (Implemented)
```
✅ users/{uid}                          - User document with status, timestamps
✅ users/{uid}/wallet/points            - Wallet with paidBalance, promoBalance
✅ users/{uid}/wallet/ledger/{entryId}  - Transaction history
✅ webhookEvents/{event_id}             - Idempotency tracking
✅ paynowCustomers/{customer_id}        - Customer to UID mapping
```

## 🔧 Scripts Created

### 1. Update Product Mapping
```bash
bash scripts/update-product-mapping.sh
```
Adds missing product ID to Secret Manager

### 2. Run Migration
```bash
npx tsx tools/fix-misplaced-points.ts
```
Moves points from `userPoints` to correct location

### 3. Test Webhook
```bash
npx tsx tools/test-paynow-webhook.ts
```
Sends signed test events

### 4. Verify Integration
```bash
npx tsx scripts/verify-webhook-integration.ts
```
Comprehensive integration test suite

## 🚀 Next Steps

1. **Update Product Mapping** (CRITICAL)
   ```bash
   # Add product ID 321641745958305792 -> 50 points
   bash scripts/update-product-mapping.sh
   ```

2. **Run Migration**
   ```bash
   export FIREBASE_PROJECT_ID=walduae-project-20250809071906
   export FIREBASE_CLIENT_EMAIL=<your-service-account-email>
   export FIREBASE_PRIVATE_KEY=<your-service-account-key>
   npx tsx tools/fix-misplaced-points.ts
   ```

3. **Test Webhook**
   ```bash
   export PAYNOW_WEBHOOK_SECRET="pn-7cade0c6397c40da9b16f79ab5df132c"
   npx tsx scripts/verify-webhook-integration.ts
   ```

## ✅ Issue Resolution

The implementation correctly:
- Uses base64 HMAC-SHA256 signature verification
- Implements 5-minute replay protection window
- Ensures idempotency via webhookEvents collection
- Credits to the correct path with numeric values
- No longer depends on client-side authentication

Once you add the missing product ID to Secret Manager, the system will be fully operational.
