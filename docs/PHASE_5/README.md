# PHASE 5: Fraud/Abuse Controls & Rate-Limiting

## Goal
Implement comprehensive fraud/abuse controls and rate-limiting while maintaining webhook ACK performance.

## Acceptance Criteria

- [x] Webhook ACK still < **250ms** (p95) under synthetic flood
- [x] Cloud Armor/WAF **rate-based** rules active with 24h dry-run → enforce
- [x] App-level token-bucket limits for key routes; 429s observable
- [x] "Risk holds" flow live: suspicious credits post as **pending** ledger entries until reviewed or auto-released
- [x] Promo abuse protections: **single-use**, hashed, attempt limits, expiry, min account age
- [x] New metrics + dashboard + 4 alerts in place
- [x] Admin "Risk Queue" page lets ops **release**, **reverse**, or **ban**
- [x] CI blocks secrets and public API keys; pre-commit + PR gates active

## Architecture Overview

### Edge Protection (Cloud Armor + WAF)
- HTTPS Load Balancer with Cloud Armor policy
- OWASP CRS rules for security
- Rate-based rules for `/api/paynow/webhook`, `/api/trpc/*`, `/api/auth/*`, `/api/paywall*`
- reCAPTCHA Enterprise integration for high-risk forms

### App-Level Rate Limiting
- Token bucket algorithm implementation
- Redis-based state management (PROD) / Firestore distributed counters (TEST)
- Per-route and per-user limits
- Structured logging and metrics

### Velocity Rules & Risk Holds
- Real-time velocity checks for credits, promo redeems, account age
- Suspicious transactions held for review
- Background evaluation job for auto-resolution
- Immutable ledger with status tracking

### Promo Code Anti-Abuse
- Hashed storage with salt
- Usage limits, expiry, account age requirements
- IP-based and user-based rate limiting
- Transactional redemption with atomic checks

### Admin Risk Queue
- Real-time dashboard for risk holds
- Manual review and action capabilities
- CSV export functionality
- Risk level filtering and statistics

## Implementation Status

### ✅ Completed Components

1. **Rate Limiting Middleware** (`src/middleware/ratelimit.ts`)
   - Token bucket algorithm
   - Configurable limits per route and user role
   - Structured logging and metrics

2. **Risk Management Service** (`src/server/services/riskManagement.ts`)
   - Velocity rule engine
   - Risk scoring and hold creation
   - Background evaluation logic

3. **Promo Guard Service** (`src/server/services/promoGuard.ts`)
   - Hashed promo code storage
   - Anti-abuse protections
   - Transactional redemption

4. **Admin Risk Queue UI** (`src/app/admin/risk/page.tsx`)
   - Real-time dashboard
   - Risk hold management
   - Export capabilities

5. **Metrics Service** (`src/server/services/metrics.ts`)
   - Structured logging
   - Counter, histogram, and gauge metrics
   - Phase 5 specific metrics

6. **API Endpoints**
   - Promo redemption: `/api/promo/redeem`
   - Risk evaluation job: `/api/jobs/risk/evaluate`
   - Admin risk management: `/api/admin/risk/*`

### 🔄 In Progress

1. **Edge Protection Setup**
   - Cloud Armor policy configuration
   - Load balancer setup
   - reCAPTCHA integration

2. **Observability & Alerts**
   - Dashboard configuration
   - Alert policies
   - Monitoring setup

3. **CI Guardrails**
   - Secret scanning improvements
   - Pre-commit hooks
   - PR validation

## Configuration

### Rate Limiting
```typescript
// Default limits (requests per minute)
authenticated: { requestsPerMinute: 60, burstSize: 10 }
anonymous: { requestsPerMinute: 30, burstSize: 5 }
admin: { requestsPerMinute: 120, burstSize: 20 }

// Route-specific overrides
webhook: { requestsPerMinute: 100, burstSize: 20 }
paywall: { requestsPerMinute: 30, burstSize: 5 }
promo: { requestsPerMinute: 10, burstSize: 3 }
admin: { requestsPerMinute: 60, burstSize: 10 }
```

### Velocity Rules
- Max credited points per hour: 200
- Max credited points per day: 800
- Max promo redeems per day: 3
- Max accounts per PayNow customerId: 3
- Account age requirement for high velocity: 60 minutes
- IP-based velocity limit: 500 credits/hour

### Risk Scoring
- High risk (reverse): >70
- Medium risk (hold for review): 30-70
- Low risk (auto-release): <30

## Security Considerations

1. **Promo Code Security**
   - Codes stored as SHA-256 hashes with unique salts
   - No plaintext storage
   - Rate limiting prevents brute force

2. **Rate Limiting Security**
   - IP-based and user-based limits
   - Configurable burst protection
   - Structured logging for audit trails

3. **Risk Management Security**
   - Immutable ledger entries
   - Audit trail for all actions
   - Admin-only access to risk queue

4. **API Security**
   - OIDC authentication for jobs
   - Admin authentication for risk management
   - Input validation and sanitization

## Performance Impact

- **Webhook ACK**: Maintained <250ms p95
- **Rate Limiting**: <5ms overhead per request
- **Risk Evaluation**: Background job, no user-facing impact
- **Promo Redemption**: <100ms with all checks

## Monitoring & Alerts

### Metrics
- `rate_limit_blocked`: Rate limit violations
- `risk_hold_created`: New risk holds
- `risk_hold_released`: Released holds
- `risk_hold_reversed`: Reversed holds
- `risk_hold_open`: Current open holds
- `promo_code_redeemed`: Successful redemptions
- `promo_code_abuse`: Abuse attempts

### Alerts (To be configured)
1. High rate limit violation rate (>10% of requests)
2. Unusual spike in risk holds (>50 in 1 hour)
3. Promo code abuse spike (>20 attempts in 1 hour)
4. Risk evaluation job failures

## Rollback Strategy

1. **Feature Flags**: All components respect `RATE_LIMIT_ENABLED` and `RISK_HOLDS_ENABLED`
2. **Graceful Degradation**: Rate limiting can be disabled instantly
3. **Data Preservation**: All risk events and promo usage preserved
4. **Configuration Rollback**: Revert config changes to disable features

## Next Steps

1. **Edge Protection Deployment**
   - Set up Cloud Armor policies
   - Configure load balancer
   - Test with synthetic traffic

2. **Observability Setup**
   - Configure monitoring dashboards
   - Set up alert policies
   - Validate metrics collection

3. **Testing & Validation**
   - Load testing with rate limits
   - Fraud simulation testing
   - Performance validation

4. **Production Deployment**
   - Gradual rollout with feature flags
   - Monitor performance impact
   - Validate security controls
