# Phase 5: Fraud Detection & Prevention System

## Overview

Phase 5 implements a comprehensive fraud detection and prevention system for the Siraj platform. The system provides real-time risk scoring, rate limiting, bot defense, and manual review capabilities to protect against fraudulent transactions and abuse.

## Features

### 🎯 Real-time Risk Scoring
- **Multi-signal evaluation**: Combines velocity, account age, bot detection, and behavioral patterns
- **Weighted scoring**: Configurable weights for different risk factors
- **Action-based decisions**: Allow, challenge, deny, or queue for manual review
- **Shadow mode**: Test without affecting user experience

### 🚦 Rate Limiting
- **Edge-level protection**: Cloud Armor integration for IP-based rate limiting
- **Application-level caps**: Per-UID and per-IP limits with minute/hour/day windows
- **Configurable thresholds**: Adjustable limits for different user types

### 🤖 Bot Defense
- **Firebase App Check**: Verify legitimate app instances
- **reCAPTCHA Enterprise**: Advanced bot detection with scoring
- **Heuristic analysis**: User agent and behavior pattern detection
- **Caching**: Performance optimization with 5-minute result caching

### 📋 Allow/Deny Lists
- **Multiple types**: IP, UID, email domain, device, card BIN
- **Expiration support**: Temporary entries with automatic cleanup
- **Bulk operations**: Efficient checking and management
- **Audit trail**: Full history of additions and removals

### 👥 Manual Review Queue
- **Admin interface**: Review flagged transactions
- **Decision tracking**: Approve/deny with notes
- **Reversal support**: Automatic ledger corrections when needed
- **Assignment system**: Track who resolved each review

## Architecture

### Services

```
src/server/services/
├── riskEngine.ts      # Main risk evaluation logic
├── velocity.ts        # Rate limiting and velocity tracking
├── lists.ts          # Allow/deny list management
└── botDefense.ts     # Bot detection and verification
```

### Data Model

```
Firestore Collections:
├── fraudSignals/{date}/{uid}/counters     # Velocity tracking
├── riskDecisions/{id}                     # Risk evaluation results
├── manualReviews/{id}                     # Review queue items
├── denylist/{type}/{value}/entry          # Deny list entries
├── allowlist/{type}/{value}/entry         # Allow list entries
└── botDefenseCache/{key}                  # Bot defense results
```

### API Endpoints

```
tRPC Routes:
├── fraud.risk.evaluateCheckout            # Risk evaluation
├── fraud.admin.lists.*                    # List management
├── fraud.admin.reviews.*                  # Review management
└── fraud.admin.stats.*                    # Statistics and metrics
```

## Configuration

### Feature Flags

```typescript
features: {
  FRAUD_SHADOW_MODE: boolean,        // Test without enforcement
  EDGE_RATE_LIMIT_ENABLED: boolean,  // Cloud Armor integration
  APP_RATE_LIMIT_ENABLED: boolean,   // Application-level limits
}
```

### Fraud Settings

```typescript
fraud: {
  checkoutCaps: {
    uid: { perMinute: 5, perHour: 20, perDay: 100 },
    ip: { perMinute: 10, perHour: 50, perDay: 200 },
  },
  minAccountAgeMinutes: 10,
  riskThresholds: {
    allow: 30,      // Score ≤ 30: Allow
    challenge: 70,  // Score 31-70: Challenge
    deny: 90,       // Score 71-90: Deny
  },                // Score > 90: Queue for review
  recaptchaSiteKey: string,
  recaptchaProject: string,
  appCheckPublicKeys: string[],
}
```

## Risk Signals

### Velocity Signals
- **Per-UID limits**: Track checkout attempts per user
- **Per-IP limits**: Track attempts per IP address
- **Time windows**: Minute, hour, and day counters
- **Threshold detection**: Alert when limits are exceeded

### Account Signals
- **Account age**: New accounts flagged for high-value purchases
- **Email domain**: Suspicious email providers
- **Geographic mismatch**: IP vs. expected location

### Behavioral Signals
- **User agent analysis**: Bot and automation detection
- **Purchase patterns**: Unusual quantities or values
- **Session behavior**: Rapid successive attempts

### External Signals
- **reCAPTCHA scores**: Bot confidence assessment
- **App Check validation**: Legitimate app verification
- **List matches**: Allow/deny list lookups

## Admin Interface

### Dashboard (`/admin/fraud`)
- **Overview statistics**: Decisions, scores, and trends
- **Recent activity**: Latest risk evaluations
- **Quick actions**: Access to lists and reviews

### List Management (`/admin/fraud/lists`)
- **CRUD operations**: Add, remove, and view entries
- **Type filtering**: Filter by IP, UID, email, etc.
- **Bulk operations**: Manage multiple entries
- **Expiration cleanup**: Remove expired entries

### Manual Reviews (`/admin/fraud/reviews`)
- **Queue management**: View pending reviews
- **Decision interface**: Approve/deny with notes
- **History tracking**: View resolved reviews
- **Assignment system**: Track who handled each review

## Performance Considerations

### Latency Targets
- **Checkout initiation**: < 150ms p95
- **Webhook processing**: < 250ms p95 (unchanged)
- **Risk evaluation**: < 50ms average

### Optimization Strategies
- **Caching**: Bot defense results cached for 5 minutes
- **Efficient queries**: Indexed Firestore collections
- **Batch operations**: Bulk list checking
- **Async processing**: Non-blocking risk evaluation

### Monitoring
- **Structured logging**: JSON logs with correlation IDs
- **Metrics**: Decision counts, scores, and latencies
- **Alerts**: Spike detection and threshold monitoring

## Security

### Data Protection
- **PII hashing**: User agents and sensitive data hashed
- **Access control**: Admin-only access to fraud data
- **Audit trails**: Full history of all decisions
- **Encryption**: All data encrypted at rest

### Rate Limiting
- **Multi-layer protection**: Edge + application level
- **Configurable limits**: Adjustable per environment
- **Burst handling**: Graceful degradation under load

### Bot Defense
- **Token verification**: App Check and reCAPTCHA validation
- **Heuristic analysis**: Pattern-based detection
- **Continuous learning**: Adapt to new attack vectors

## Deployment

### Prerequisites
1. **Cloud Armor**: Configure edge rate limiting
2. **reCAPTCHA Enterprise**: Set up project and keys
3. **Firebase App Check**: Enable for web app
4. **Firestore indexes**: Deploy new collection indexes

### Rollout Strategy
1. **Shadow mode**: Deploy with `FRAUD_SHADOW_MODE=true`
2. **Data collection**: Gather 24-48 hours of baseline data
3. **Threshold tuning**: Adjust based on observed patterns
4. **Enforcement**: Set `FRAUD_SHADOW_MODE=false`
5. **Monitoring**: Watch for false positives and performance

### Configuration Updates
```bash
# Update Secret Manager with new fraud config
gcloud secrets versions add siraj-config --data-file=config.json

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Update Cloud Armor policy
gcloud compute security-policies update fraud-policy --file=policy.yaml
```

## Testing

### Automated Tests
```bash
# Run fraud system tests
pnpm tsx scripts/test-fraud-system.ts

# Test specific components
pnpm tsx scripts/test-velocity.ts
pnpm tsx scripts/test-lists.ts
pnpm tsx scripts/test-bot-defense.ts
```

### Manual Testing
1. **Velocity limits**: Exceed rate limits and verify blocking
2. **Bot detection**: Test with suspicious user agents
3. **List management**: Add/remove entries and verify behavior
4. **Manual reviews**: Create and resolve review items

### Load Testing
```bash
# Test rate limiting
ab -n 1000 -c 10 https://your-domain.com/api/trpc/checkout.create

# Test bot defense
curl -H "User-Agent: python-requests/2.28.1" https://your-domain.com/api/trpc/checkout.create
```

## Monitoring & Alerts

### Key Metrics
- `fraud_decisions_total{action="deny"}`: Denial rate
- `fraud_decisions_total{action="queue_review"}`: Review queue size
- `fraud_evaluation_duration_ms`: Performance monitoring
- `rate_limit_blocks_total`: Rate limiting effectiveness

### Alert Conditions
- **High denial rate**: > 10% for 5 minutes
- **Review queue backlog**: > 50 items for 10 minutes
- **Performance degradation**: p95 > 200ms for 2 minutes
- **Bot attack detection**: > 100 bot attempts per minute

### Dashboard Panels
- **Decision distribution**: Pie chart of allow/challenge/deny/review
- **Score distribution**: Histogram of risk scores
- **Velocity trends**: Time series of rate limit hits
- **Review queue**: Current backlog and resolution time

## Troubleshooting

### Common Issues

#### High False Positives
1. **Adjust thresholds**: Lower risk thresholds in config
2. **Review signals**: Analyze which signals are too aggressive
3. **Allowlist trusted users**: Add known good users to allowlist

#### Performance Issues
1. **Check caching**: Verify bot defense cache is working
2. **Review indexes**: Ensure Firestore indexes are deployed
3. **Monitor queries**: Check for slow Firestore operations

#### Bot Defense Failures
1. **Verify tokens**: Check App Check and reCAPTCHA configuration
2. **Test endpoints**: Verify external service connectivity
3. **Review logs**: Check for authentication errors

### Debug Commands
```bash
# Check fraud system status
pnpm tsx scripts/test-fraud-system.ts

# View recent decisions
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.component=fraud" --limit=50

# Monitor rate limiting
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.message:rate_limit" --limit=20
```

## Future Enhancements

### Planned Features
- **Machine learning**: Adaptive risk scoring based on historical data
- **Device fingerprinting**: Advanced device identification
- **Geographic analysis**: IP geolocation and country-based rules
- **Social signals**: Social media integration for trust scoring

### Integration Opportunities
- **Third-party services**: MaxMind, Sift, or similar fraud detection
- **Payment processor data**: Enhanced signals from PayNow events
- **User behavior analytics**: Session analysis and pattern recognition
- **Real-time collaboration**: Share threat intelligence across platforms

## Support

For questions or issues with the fraud system:

1. **Check logs**: Review structured logs for error details
2. **Run tests**: Execute test suite to verify functionality
3. **Review config**: Validate configuration settings
4. **Contact team**: Reach out to the development team

---

**Last updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready
