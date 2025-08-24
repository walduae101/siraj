# Phase 5: Fraud Detection & Prevention Design

## Overview

Phase 5 implements comprehensive fraud detection and prevention capabilities for the Siraj platform, including risk scoring, rate limiting, bot defense, and manual review workflows.

## Architecture

### Core Components

1. **Fraud Service** (`src/server/services/fraud.ts`)
   - Central orchestrator for fraud evaluation
   - Integrates all fraud detection components
   - Handles mode switching (shadow/enforce)

2. **Risk Engine** (`src/server/services/riskEngine.ts`)
   - Calculates risk scores based on multiple signals
   - Determines verdicts (allow/review/deny)
   - Stores decisions and signals

3. **Velocity Service** (`src/server/services/velocity.ts`)
   - Tracks request patterns per IP and UID
   - Implements sharded counters for scalability
   - Provides rate limiting capabilities

4. **Lists Service** (`src/server/services/lists.ts`)
   - Manages allow/deny lists
   - Supports multiple list types (IP, UID, email, device, BIN)
   - Handles wildcard patterns

5. **Bot Defense Service** (`src/server/services/botDefense.ts`)
   - Verifies App Check tokens
   - Integrates with reCAPTCHA Enterprise
   - Provides confidence scoring

### Data Model

#### Collections

1. **fraudSignals/{signalId}**
   ```
   uid: string
   paynowCustomerId?: string
   subjectType: "order" | "user" | "subscription"
   subjectId: string
   ipHash: string
   deviceHash: string
   country?: string
   emailDomain?: string
   binHash?: string
   velocityMinute: number
   velocityHour: number
   velocityDay: number
   chargebacks90d: number
   firstSeenAt: Date
   createdAt: Date
   ```

2. **riskDecisions/{decisionId}**
   ```
   mode: "shadow" | "enforce"
   score: number (0-100)
   verdict: "allow" | "review" | "deny"
   threshold: number
   reasons: string[]
   subjectType: "order" | "user" | "subscription"
   subjectId: string
   uid: string
   linkedSignalIds: string[]
   processingMs: number
   createdAt: Date
   expiresAt: Date (TTL 90d)
   ```

3. **rlCounters/{counterId}**
   ```
   count: number
   windowStart: Date
   updatedAt: Date
   scope: "ip" | "uid"
   key: string
   period: "1m" | "1h" | "1d"
   shardId: number
   ```

4. **denylist/{key}** and **allowlist/{key}**
   ```
   type: "ip" | "uid" | "emailDomain" | "device" | "bin"
   value: string
   reason: string
   addedBy: string
   addedAt: Date
   expiresAt?: Date
   ```

5. **manualReviews/{ticketId}**
   ```
   subjectType: "order" | "user" | "subscription"
   subjectId: string
   uid: string
   score: number
   evidence: Record<string, any>
   status: "open" | "approved" | "rejected"
   createdAt: Date
   updatedAt: Date
   reviewedBy?: string
   ```

## Risk Scoring Algorithm

### Signal Weights

1. **Velocity Signals** (40% total weight)
   - High velocity per minute: +20 points
   - High velocity per hour: +15 points
   - High velocity per day: +10 points

2. **Reputation Signals** (30% total weight)
   - Chargeback history: +10 points per chargeback
   - Blocked country: +30 points
   - High-risk email domain: +15 points

3. **Bot Defense** (20% total weight)
   - Missing App Check token: +10 points
   - Missing reCAPTCHA token: +10 points
   - Low reCAPTCHA score: +20 points

4. **Account Signals** (10% total weight)
   - New account (< 10 minutes): +5 points
   - Suspicious device patterns: +10 points

### Thresholds

- **Purchase transactions**: 65 points
- **Subscription activations**: 60 points
- **Review zone**: 70-90% of threshold
- **Deny zone**: >90% of threshold

## Rate Limiting

### Limits

- **Per IP per minute**: 60 requests
- **Per UID per minute**: 30 requests
- **Per UID per hour**: 200 requests

### Implementation

- Uses sharded counters to avoid hot-spots
- Fixed shard count of 10 per key
- Atomic increments via Firestore transactions
- Automatic window sliding

## Bot Defense

### App Check

- Required on all write endpoints
- Verifies token authenticity
- Provides device fingerprinting

### reCAPTCHA Enterprise

- Optional integration
- Server-side assessment
- Minimum score threshold: 0.6
- Configurable per endpoint

## Mode Switching

### Shadow Mode

- Evaluates fraud but doesn't block
- Logs all decisions and signals
- Allows monitoring without impact
- Default mode for safe rollout

### Enforce Mode

- Blocks transactions based on verdicts
- Creates manual review tickets
- Requires careful monitoring
- Activated via config change

## Integration Points

### Webhook Processing

- Fraud evaluation before wallet credit
- Fast path (< 250ms target)
- Structured logging for observability
- Graceful degradation on errors

### Checkout Flow

- Pre-purchase risk assessment
- Real-time decision making
- Challenge/response for high-risk users
- Integration with payment providers

### Admin Interface

- Dashboard with real-time metrics
- Manual review queue management
- List management (allow/deny)
- Decision history and analytics

## Security Considerations

### Data Privacy

- IP addresses hashed before storage
- Email domains normalized
- Device fingerprints anonymized
- PII not logged in structured logs

### Access Control

- Admin-only access to fraud data
- Service-only write permissions
- UID-scoped read access
- Audit trail for all changes

### Rate Limiting

- Prevents enumeration attacks
- Protects against brute force
- Configurable per endpoint
- Graceful degradation

## Performance Considerations

### Optimization

- Sharded counters for scalability
- Indexed queries for fast lookups
- TTL fields for automatic cleanup
- Caching for repeated checks

### Monitoring

- Processing time tracking
- Decision latency metrics
- Error rate monitoring
- Resource utilization

## Rollout Strategy

### Phase 1: Shadow Mode

1. Deploy with FRAUD_MODE="shadow"
2. Monitor decision patterns
3. Tune thresholds and weights
4. Validate with synthetic tests

### Phase 2: Enforce Mode

1. Enable FRAUD_MODE="enforce"
2. Monitor block rates
3. Adjust thresholds if needed
4. Scale manual review capacity

### Phase 3: Optimization

1. Analyze false positive rates
2. Refine scoring algorithm
3. Add new signals as needed
4. Optimize performance

## Future Enhancements

### Advanced Signals

- Machine learning models
- Behavioral analysis
- Network reputation
- Device fingerprinting

### Automation

- Auto-approval workflows
- Dynamic threshold adjustment
- Predictive analytics
- Automated responses

### Integration

- Third-party fraud services
- Industry blacklists
- Cross-platform signals
- Real-time threat feeds
