# Structured Logging Field Dictionary

**Updated on: 2025-01-10**

---

## Overview

This document defines all structured logging fields used in the PayNow webhook system. All log entries follow this schema for consistent monitoring and alerting.

---

## Standard Log Structure

### Base Fields (All Logs)
```json
{
  "severity": "INFO" | "WARNING" | "ERROR",
  "message": "Human-readable message",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "component": "paynow_webhook" | "paynow_worker"
}
```

### Required Fields
- `severity`: Log level for filtering and alerting
- `message`: Descriptive message for the log event
- `timestamp`: ISO 8601 timestamp in UTC
- `component`: System component that generated the log

---

## Webhook Component Fields

### Common Fields (All Webhook Events)
```json
{
  "event_id": "evt_abc123",
  "event_type": "ON_ORDER_COMPLETED",
  "processing_ms": 150
}
```

### Event Reception
**Message**: `"Webhook received"`
```json
{
  "event_id": "evt_abc123",
  "event_type": "ON_ORDER_COMPLETED", 
  "order_id": "order_456",
  "paynow_customer_id": "cust_789",
  "timestamp": "1641024000000"
}
```

### Successful Processing
**Message**: `"Webhook processed successfully"`
```json
{
  "event_id": "evt_abc123",
  "event_type": "ON_ORDER_COMPLETED",
  "order_id": "order_456", 
  "paynow_customer_id": "cust_789",
  "uid": "firebase_user_123",
  "product_id": "prod_QQfmFQiRyeLPBZ",
  "points": 50,
  "idempotent": false,
  "processing_ms": 150
}
```

### Idempotent Skip
**Message**: `"Event already processed, skipping"`
```json
{
  "event_id": "evt_abc123",
  "event_type": "ON_ORDER_COMPLETED",
  "idempotent": true,
  "processing_ms": 25
}
```

### Rejection Events
**Message**: `"Webhook rejected - [reason]"`
```json
{
  "event_id": "evt_abc123",
  "rejection_reason": "invalid_signature" | "invalid_timestamp" | "missing_event_type" | "unmapped_product",
  "headers": ["content-type", "paynow-signature", ...], // For signature failures
  "timestamp": "1641024000000" // For timestamp failures
}
```

---

## Worker Component Fields (Phase 2)

### Message Reception
**Message**: `"Worker received message"`
```json
{
  "component": "paynow_worker",
  "event_id": "evt_abc123",
  "event_type": "order.paid",
  "message_id": "pubsub_msg_456",
  "attributes": {
    "uid": "firebase_user_123",
    "ordering_key": "firebase_user_123"
  }
}
```

### Successful Processing
**Message**: `"Worker processed event successfully"`
```json
{
  "component": "paynow_worker",
  "event_id": "evt_abc123",
  "event_type": "order.paid",
  "uid": "firebase_user_123",
  "points": 100,
  "processing_ms": 250
}
```

### Worker Failures
**Message**: `"Worker processing failed"`
```json
{
  "component": "paynow_worker",
  "event_id": "evt_abc123", 
  "event_type": "order.paid",
  "error": "Unknown product: prod_invalid",
  "processing_ms": 50,
  "terminal": true
}
```

---

## Field Definitions

### Core Identifiers
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `event_id` | string | Unique PayNow event identifier | `"evt_abc123"` |
| `event_type` | string | PayNow event type | `"ON_ORDER_COMPLETED"` |
| `order_id` | string | PayNow order identifier | `"order_456"` |
| `uid` | string | Firebase user identifier | `"firebase_user_123"` |
| `paynow_customer_id` | string | PayNow customer identifier | `"cust_789"` |

### Processing Metrics
| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `processing_ms` | number | Processing latency in milliseconds | 10-5000 |
| `points` | number | Points credited/affected | 1-10000 |
| `idempotent` | boolean | Whether operation was duplicate | true/false |

### Error Classification
| Field | Type | Description | Values |
|-------|------|-------------|--------|
| `rejection_reason` | string | Why webhook was rejected | `"invalid_signature"`, `"invalid_timestamp"`, `"unmapped_product"` |
| `terminal` | boolean | Whether error should not be retried | true/false |
| `error` | string | Error message for failures | Variable text |

### Queue Fields (Phase 2)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `message_id` | string | Pub/Sub message identifier | `"pubsub_msg_456"` |
| `publish_ms` | number | Time to publish to queue | 5-50 |
| `ordering_key` | string | Queue ordering key | `"firebase_user_123"` |

---

## Log Query Examples

### Operational Queries

**All webhook activity**:
```
jsonPayload.component="paynow_webhook"
timestamp >= "2025-01-10T00:00:00Z"
```

**Performance analysis**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.processing_ms > 1000
```

**Error investigation**:
```
jsonPayload.component="paynow_webhook"
severity="ERROR"
timestamp >= "2025-01-10T00:00:00Z"
```

**User transaction history**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.uid="firebase_user_123"
```

### Security Queries

**Failed authentication attempts**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.rejection_reason="invalid_signature"
```

**Replay attack attempts**:
```
jsonPayload.component="paynow_webhook"  
jsonPayload.rejection_reason="invalid_timestamp"
```

**Idempotency effectiveness**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.idempotent=true
```

### Business Intelligence

**Points credited by product**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.points > 0
jsonPayload.product_id != ""
```

**Processing time distribution**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.processing_ms > 0
```

**Event type breakdown**:
```
jsonPayload.component="paynow_webhook"
jsonPayload.event_type != ""
```

---

## Metric Source Fields

### Log-based Metrics Usage

| Metric | Source Field | Filter |
|--------|--------------|--------|
| `paynow_webhook_requests` | Count | `message="Webhook received"` |
| `paynow_webhook_failures` | Count | `severity="ERROR" OR severity="WARNING"` |
| `paynow_points_credited` | `points` | `points>0 AND message="Webhook processed successfully"` |
| `paynow_webhook_latency` | `processing_ms` | `processing_ms>0` |

### Aggregation Guidelines
- **Counters**: Use for request counts, error counts
- **Distributions**: Use for latency, points amounts  
- **Gauges**: Use for active connections, queue depth

---

## Privacy & Security

### PII Handling
**NEVER LOG**:
- Email addresses
- Payment card information
- Personal names  
- Physical addresses
- Phone numbers

**SAFE TO LOG**:
- User IDs (Firebase UIDs)
- Order IDs
- Product IDs  
- Customer IDs (PayNow)
- Amounts and quantities

### Data Retention
- **Operational Logs**: 30-day TTL (automatic deletion)
- **Audit Logs**: 90-day retention (compliance)
- **Security Logs**: 1-year retention (incident investigation)

### Access Controls
- **Read Access**: Engineers with project viewer role
- **Export Access**: Security team and compliance officers
- **Retention Management**: Platform engineering team

---

## Log Validation

### Required Field Validation
```typescript
// Example validation schema
interface WebhookLogEntry {
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
  timestamp: string;
  component: "paynow_webhook";
  event_id: string;
  processing_ms?: number;
  idempotent?: boolean;
  points?: number;
  uid?: string;
  rejection_reason?: string;
}
```

### Quality Checks
- All logs must include base fields
- Timestamps must be valid ISO 8601
- Processing time must be reasonable (1-10000ms)
- Event IDs must be unique and traceable

---

This field dictionary ensures consistent structured logging across all PayNow webhook components and enables reliable monitoring and alerting.
