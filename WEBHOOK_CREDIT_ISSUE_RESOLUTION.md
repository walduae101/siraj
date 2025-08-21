# PayNow Webhook Credit Issue Resolution

## 🔴 The Problem

You completed a PayNow purchase but credits weren't appearing in your wallet because:

1. **Wrong Collection**: Credits went to `userPoints/buH7oCwh1qb...` with string value `"50"` instead of `users/{uid}/wallet/points` with numeric value `50`

2. **401 Errors**: The success page was calling `checkout.complete` mutation which failed with 401 (Unauthorized) because the user wasn't authenticated after PayNow redirect

3. **Product ID Mismatch**: The PayNow order used product ID `321641745958305792` which doesn't exist in your product mapping

## ✅ What Was Fixed

### 1. Success Page - No More 401 Errors
- **Before**: Used tRPC mutation `checkout.complete` which required auth
- **After**: Now uses Firestore real-time listener to watch wallet balance
- **Result**: No more 401 errors, smooth user experience

### 2. Test Webhook Script
- Updated to use proper base64 HMAC signing
- Uses lowercase headers (`paynow-signature`, `paynow-timestamp`) 
- Sends timestamps in milliseconds (not seconds)
- Pre-configured with your actual Firebase UID

### 3. Migration Script Created
- `tools/fix-misplaced-points.ts` - Migrates points from wrong `userPoints` collection
- Converts string values to numbers
- Creates proper ledger entries

## 🚨 Root Cause Analysis

The `userPoints` collection write is NOT in your current codebase. Possible sources:
1. **Old webhook handler** still running somewhere (check for multiple deployments)
2. **PayNow dashboard** configured to write directly to Firestore
3. **Firebase Function** handling webhooks separately

## 🛠️ Immediate Actions Required

### 1. Fix Product Mapping
The product ID from your purchase (`321641745958305792`) is missing from the mapping. Update Google Secret Manager:

```json
{
  "paynow": {
    "products": {
      "321641745958305792": "50",  // Add this line
      "points_50": "458255405240287232",
      // ... other products
    }
  }
}
```

### 2. Run Migration Script
To move the misplaced points:

```bash
# Set environment variables
export FIREBASE_PROJECT_ID=walduae-project-20250809071906
export FIREBASE_CLIENT_EMAIL=your-service-account-email
export FIREBASE_PRIVATE_KEY="your-service-account-private-key"

# Run migration
npx tsx tools/fix-misplaced-points.ts
```

### 3. Test the Webhook
After deployment completes, test with:

```bash
# Set your webhook secret
export PAYNOW_WEBHOOK_SECRET="pn-7cade0c6397c40da9b16f79ab5df132c"
export WEBHOOK_URL="https://siraj-btmgk7htca-uc.a.run.app/api/paynow/webhook"

# Run test
npx tsx tools/test-paynow-webhook.ts
```

## 📊 Verification Steps

1. **Check Firestore Console**:
   - `users/OPvJByA50jQmxGrgsqmrn794Axd2/wallet/points` - Should show increased `paidBalance`
   - `webhookEvents/{eventId}` - Should show processed events
   - `users/{uid}/ledger/{entryId}` - Should show credit entries

2. **Check Success Page**:
   - No more 401 errors in console
   - Should show "Processing payment..." then update when balance changes

3. **Check Logs**:
   ```bash
   gcloud logging read 'resource.labels.service_name="siraj" AND jsonPayload.message:"webhook"' --limit=10 --project=walduae-project-20250809071906
   ```

## 🔍 Finding the Mystery Writer

To locate what's creating `userPoints`:

1. **Check All Cloud Run Services**:
   ```bash
   gcloud run services list --project=walduae-project-20250809071906
   ```

2. **Check Firebase Functions**:
   ```bash
   firebase functions:list --project walduae-project-20250809071906
   ```

3. **Check PayNow Dashboard**:
   - Verify webhook URL points to your Cloud Run service
   - Check if there are multiple webhook endpoints configured

4. **Search Logs for userPoints Writes**:
   ```bash
   gcloud logging read 'textPayload:"userPoints"' --limit=50 --project=walduae-project-20250809071906
   ```

## 🎯 Summary

Your webhook implementation is correct, but:
1. The product ID needs to be added to the mapping
2. Something else is writing to `userPoints` (not your current code)
3. The success page now works without auth dependency

Once you add the missing product ID to Secret Manager and find/disable whatever is writing to `userPoints`, the system should work correctly.
