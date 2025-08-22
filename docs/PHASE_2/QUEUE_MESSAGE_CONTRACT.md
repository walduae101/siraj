# Queue Message Contract - PayNow Events

**Updated on: 2025-01-10**

---

## Overview

This document defines the message format and contract for PayNow webhook events published to Google Cloud Pub/Sub. All queue messages must follow this schema for proper processing.

---

## Message Structure

### Message Body (JSON)
```json
{
  "eventId": "evt_abc123",
  "eventType": "order.paid",
  "timestamp": "2025-01-10T12:00:00Z",
  "data": {
    "order": {
      "id": "order_123",
      "prettyId": "ORD-2025-001",
      "customerId": "cust_456",
      "items": [
        {
          "productId": "prod_789",
          "quantity": 1,
          "price": "10.00"
        }
      ]
    }
  }
}
```

### Message Attributes
```
event_id: "evt_abc123"
event_type: "order.paid" 
order_id: "order_123"
paynow_customer_id: "cust_456"
uid: "firebase_uid_123" (if mapped)
points: "1000" (if calculated)
ordering_key: "firebase_uid_123" (CRITICAL for serialization)
```

---

## Field Definitions

### Required Message Fields
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `eventId` | string | Unique PayNow event identifier | `"evt_abc123"` |
| `eventType` | string | PayNow event type | `"order.paid"` |
| `timestamp` | string | ISO 8601 timestamp from PayNow | `"2025-01-10T12:00:00Z"` |
| `data` | object | Minimal event payload (no PII) | See structure above |

### Required Message Attributes
| Attribute | Type | Description | Critical |
|-----------|------|-------------|----------|
| `ordering_key` | string | User identifier for serialization | ✅ YES |
| `event_id` | string | For logging and tracing | ✅ YES |
| `uid` | string | Firebase user ID (if resolved) | ⚠️ Optional |
| `points` | string | Points to credit (if known) | ⚠️ Optional |

---

## Ordering Guarantees

### Ordering Key Strategy
```typescript
// Priority order for ordering key
const orderingKey = uid || paynowCustomerId || "unknown";
```

**Critical**: Events with the same ordering key will be:
1. **Delivered in order** to the worker
2. **Processed serially** (no concurrent processing)  
3. **Retried in order** if failures occur

### Ordering Key Examples
- User-specific events: `"firebase_uid_123"`
- Guest checkout: `"paynow_customer_456"`  
- Unmapped customer: `"unknown"` (processed in any order)

---

## PII Guidelines

### ❌ NEVER Include in Messages
- Email addresses (`customer.email`)
- Phone numbers
- Full names
- Physical addresses
- Payment card details
- IP addresses

### ✅ SAFE to Include
- System identifiers (UIDs, customer IDs, order IDs)
- Product references (product IDs, SKUs)
- Amounts and quantities (numbers only)
- Timestamps
- Status codes

### Data Minimization
```typescript
// ✅ GOOD: Minimal data structure
{
  eventId: "evt_123",
  data: {
    order: {
      id: "order_456",
      customerId: "cust_789",  // ID only
      items: [{
        productId: "prod_ABC",  // ID only
        quantity: 1
      }]
    }
  }
}

// ❌ BAD: Includes PII
{
  eventId: "evt_123", 
  data: {
    order: {
      customer: {
        email: "user@example.com",  // PII
        name: "John Doe"            // PII
      }
    }
  }
}
```

---

## Message Size Limits

### Pub/Sub Constraints
- **Maximum message size**: 10MB
- **Recommended size**: <256KB  
- **Attributes limit**: 100 attributes, 1024 bytes per value

### Optimization Guidelines
- Include only essential data for processing
- Use references (IDs) instead of full objects
- Paginate large orders if needed
- Compress large payloads if required

---

## Retry Behavior

### Automatic Retry (Pub/Sub)
```yaml
RetryPolicy:
  minimum_backoff: 10s
  maximum_backoff: 600s  
  maximum_delivery_attempts: 5
```

### Error Classification
1. **5xx Worker Response**: Transient error → Retry with backoff
2. **4xx Worker Response**: Terminal error → Send to DLQ
3. **No Response**: Network timeout → Retry with backoff

### Dead Letter Queue
- **Topic**: `paynow-events-dlq`
- **Retention**: 14 days
- **Purpose**: Manual investigation and replay
- **Alert**: Any messages in DLQ require immediate attention

---

## Example Message Flows

### Successful Processing
```
1. Webhook → Publish (ordering_key: "user123") 
2. Pub/Sub → Deliver to Worker
3. Worker → Process → ACK (200)
4. Result: Points credited, message deleted
```

### Duplicate Event
```
1. Webhook → Publish (same eventId)
2. Worker → Check webhookEvents → Skip
3. Worker → ACK (204)  
4. Result: No double credit, message deleted
```

### Unknown Product (Terminal)
```
1. Webhook → Publish
2. Worker → Process → Unknown product error
3. Worker → ACK (400) → DLQ
4. Result: No credit, message in DLQ for investigation
```

### Transient Database Error
```
1. Webhook → Publish
2. Worker → Process → Database timeout  
3. Worker → NACK (500)
4. Pub/Sub → Retry after backoff
5. Worker → Process → Success → ACK (200)
```

---

## Message Contract Validation

### Schema Validation (TypeScript)
```typescript
interface QueueMessage {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: {
    order?: {
      id: string;
      customerId?: string;
      items?: Array<{
        productId: string;
        quantity: number;
        price?: string;
      }>;
    };
  };
}

interface MessageAttributes {
  event_id: string;
  event_type: string;
  ordering_key: string;
  uid?: string;
  order_id?: string;
  paynow_customer_id?: string;
  points?: string;
}
```

### Runtime Validation
- Worker validates all required fields on message receipt
- Invalid messages logged and sent to DLQ
- Schema violations trigger terminal error classification

---

## Monitoring & Observability

### Message Tracking
Each message generates log entries at:
1. **Publish**: Webhook publishes to Pub/Sub
2. **Receive**: Worker receives from subscription
3. **Process**: Worker completes or fails processing
4. **ACK/NACK**: Worker acknowledges or rejects message

### Correlation Fields
- `event_id`: Traces message through entire pipeline
- `message_id`: Pub/Sub message identifier
- `ordering_key`: Grouping for serial processing analysis

---

## Version History

- **v1.0** (2025-01-10): Initial message contract
- Established PII guidelines
- Defined ordering key strategy
- Specified retry behavior

---

This message contract ensures reliable, ordered processing while maintaining security and privacy standards.
