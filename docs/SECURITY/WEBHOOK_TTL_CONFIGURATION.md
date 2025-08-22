# Webhook Events TTL Configuration

**Updated on: 2025-01-10**

---

## Overview

The `webhookEvents` collection uses Time-to-Live (TTL) to automatically delete old webhook event documents after 30 days. This maintains storage efficiency and complies with data retention policies.

---

## Implementation

### 1. Code Configuration

The webhook handler automatically adds an `expiresAt` field to all documents:

```typescript
const now = Timestamp.now();
const expiresAt = Timestamp.fromMillis(
  now.toMillis() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
);

await webhookRef.set({
  eventId,
  rawEventType: eventType,
  status: "received",
  receivedAt: now,
  expiresAt, // TTL field
  // ... other fields
});
```

### 2. Firebase Console Configuration

**Manual Setup Required** (one-time):

1. Go to [Firestore TTL Policies](https://console.firebase.google.com/project/walduae-project-20250809071906/firestore/databases/-default-/time-to-live)
2. Click **"Create policy"**
3. Configure:
   - **Collection**: `webhookEvents`
   - **Date/Time field**: `expiresAt`
4. Click **"Create"**
5. Status should show **"Serving"**

### 3. Alternative: gcloud CLI Setup

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=webhookEvents \
  --enable-ttl \
  --project=walduae-project-20250809071906
```

---

## TTL Policy Details

### Retention Period
- **Duration**: 30 days from webhook receipt
- **Purpose**: Operational debugging and incident investigation
- **Compliance**: Balances storage costs with operational needs

### Automatic Deletion
- **Schedule**: TTL deletion runs periodically (not immediately at expiration)
- **Scope**: Documents where `expiresAt` < current time
- **Irreversible**: Deleted documents cannot be recovered

### Data Impact
- **Audit Trail**: 30-day window for incident investigation
- **Storage Cost**: Prevents unlimited growth of webhook logs
- **Performance**: Reduces collection size for faster queries

---

## Monitoring TTL Policy

### Verification Queries

**Check TTL Configuration**:
```javascript
// Verify policy is active
const ttlPolicies = await db.runQuery({
  select: ['__name__'],
  from: ['webhookEvents'],
  where: ['expiresAt', '<', new Date()]
});
```

**Monitor Deletion Activity**:
```bash
# Check for documents past expiry (should be minimal)
gcloud logging read 'protoPayload.methodName="google.firestore.v1.Firestore.BatchWrite" AND protoPayload.serviceName="firestore.googleapis.com"' \
  --filter='protoPayload.request.writes.delete' \
  --limit=50
```

### Cloud Monitoring Metrics

The TTL deletion process generates metrics:
- `firestore.googleapis.com/api/request_count` (for deletion operations)
- Custom log-based metric for TTL deletions (optional)

---

## Important Considerations

### Data Retention
- **30 days** provides sufficient time for:
  - Debugging webhook issues
  - Incident post-mortems  
  - Reconciliation audits
  - Performance analysis

### Compliance
- **GDPR**: Automatic deletion supports data minimization
- **PCI**: Webhook logs contain no payment card data
- **SOX**: Transaction ledger (permanent) separate from operational logs (TTL)

### Operational Impact
- **Debugging**: Historical webhook events available for 30 days
- **Reconciliation**: Monthly reconciliation must complete within retention window
- **Incident Response**: Full webhook trail available during retention period

---

## Recovery Procedures

### If TTL Policy Fails
```bash
# Check TTL policy status
gcloud firestore databases describe --database="(default)" --format="yaml"

# Manually query old documents
gcloud firestore export gs://backup-bucket/manual-export \
  --collection-ids=webhookEvents \
  --async
```

### Manual Cleanup (Emergency)
```javascript
// Delete old webhook events manually (use sparingly)
const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
const oldDocs = await db.collection('webhookEvents')
  .where('receivedAt', '<', cutoff)
  .limit(100)
  .get();

const batch = db.batch();
oldDocs.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
```

---

## Configuration Validation

### Verify TTL is Active
1. **Console Check**: TTL policies page shows "Serving" status
2. **Test Document**: Create test webhook event and verify `expiresAt` field
3. **Monitoring**: No alerts for TTL policy failures

### Health Indicators
- ✅ **TTL Policy**: Status = "Serving"
- ✅ **Collection Size**: Not growing indefinitely  
- ✅ **Query Performance**: Consistent response times
- ✅ **Storage Costs**: Stable or decreasing

---

## TTL Policy Status

**Current Status**: ✅ **SERVING** (confirmed active)  
**Next Review**: February 10, 2025  
**Retention Period**: 30 days  
**Collection**: webhookEvents  
**Field**: expiresAt

---

This TTL configuration ensures optimal storage management while maintaining operational debugging capabilities.
