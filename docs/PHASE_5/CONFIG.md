# Phase 5: Configuration Guide

## Feature Flags

All Phase 5 fraud detection features are controlled via configuration flags that can be set in Google Secret Manager or environment variables.

### Core Fraud Mode

```typescript
FRAUD_MODE: "off" | "shadow" | "enforce"
```

- **Default**: `"shadow"`
- **Description**: Controls the fraud detection mode
- **Values**:
  - `"off"`: Disables all fraud detection
  - `"shadow"`: Evaluates fraud but doesn't block transactions
  - `"enforce"`: Blocks transactions based on fraud verdicts

### Score Thresholds

```typescript
FRAUD_SCORE_THRESHOLD_PURCHASE: number (0-100)
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION: number (0-100)
```

- **Defaults**: 65 (purchase), 60 (subscription)
- **Description**: Risk score thresholds for different transaction types
- **Usage**: Scores above threshold trigger review/deny verdicts

### Country Blocking

```typescript
FRAUD_BLOCK_COUNTRIES: string[] (ISO-2 codes)
```

- **Default**: `[]`
- **Description**: List of country codes to block
- **Example**: `["XX", "YY"]` to block countries XX and YY

### Test User Override

```typescript
FRAUD_ALLOW_TEST_USERS: boolean
```

- **Default**: `true`
- **Description**: Allow test users to bypass fraud checks
- **Usage**: Set to `false` in production

## Rate Limiting Configuration

### Limits

```typescript
RATE_LIMITS: {
  perIpPerMin: number,
  perUidPerMin: number,
  perUidPerHour: number
}
```

- **Defaults**: 60, 30, 200
- **Description**: Rate limits for different scopes and periods
- **Units**: Requests per time period

### Implementation Details

- Uses sharded counters to avoid hot-spots
- Fixed shard count of 10 per key
- Atomic increments via Firestore transactions
- Automatic window sliding

## Bot Defense Configuration

### App Check

```typescript
BOTDEFENSE: {
  appCheckRequired: boolean,
  recaptchaEnterpriseSiteKey?: string,
  minScore: number (0-1)
}
```

- **Defaults**: `true`, `undefined`, `0.6`
- **Description**: Bot defense configuration
- **Usage**:
  - `appCheckRequired`: Require App Check tokens on write endpoints
  - `recaptchaEnterpriseSiteKey`: reCAPTCHA Enterprise site key
  - `minScore`: Minimum reCAPTCHA score (0.0 to 1.0)

## Environment Variables

### Core Fraud Settings

```bash
# Fraud mode
FRAUD_MODE=shadow

# Score thresholds
FRAUD_SCORE_THRESHOLD_PURCHASE=65
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=60

# Country blocking
FRAUD_BLOCK_COUNTRIES=XX,YY

# Test users
FRAUD_ALLOW_TEST_USERS=true
```

### Rate Limiting

```bash
# Rate limits
FRAUD_RATE_LIMITS_PER_IP_PER_MIN=60
FRAUD_RATE_LIMITS_PER_UID_PER_MIN=30
FRAUD_RATE_LIMITS_PER_UID_PER_HOUR=200
```

### Bot Defense

```bash
# Bot defense
FRAUD_BOTDEFENSE_APP_CHECK_REQUIRED=true
FRAUD_BOTDEFENSE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_site_key
FRAUD_BOTDEFENSE_MIN_SCORE=0.6
```

## Google Secret Manager Keys

### Required Keys

```bash
# Core fraud configuration
FRAUD_MODE
FRAUD_SCORE_THRESHOLD_PURCHASE
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION
FRAUD_BLOCK_COUNTRIES
FRAUD_ALLOW_TEST_USERS

# Rate limiting
FRAUD_RATE_LIMITS_PER_IP_PER_MIN
FRAUD_RATE_LIMITS_PER_UID_PER_MIN
FRAUD_RATE_LIMITS_PER_UID_PER_HOUR

# Bot defense
FRAUD_BOTDEFENSE_APP_CHECK_REQUIRED
FRAUD_BOTDEFENSE_RECAPTCHA_ENTERPRISE_SITE_KEY
FRAUD_BOTDEFENSE_MIN_SCORE
```

### Optional Keys

```bash
# Legacy fraud settings (for backward compatibility)
FRAUD_CHECKOUT_CAPS_UID_RPM
FRAUD_CHECKOUT_CAPS_UID_RPH
FRAUD_CHECKOUT_CAPS_UID_RPD
FRAUD_CHECKOUT_CAPS_IP_RPM
FRAUD_CHECKOUT_CAPS_IP_RPH
FRAUD_CHECKOUT_CAPS_IP_RPD
FRAUD_MIN_ACCOUNT_AGE_MINUTES
FRAUD_RISK_THRESHOLDS_ALLOW
FRAUD_RISK_THRESHOLDS_CHALLENGE
FRAUD_RISK_THRESHOLDS_DENY

# Bot defense (legacy)
RECAPTCHA_SITE_KEY
RECAPTCHA_PROJECT
APP_CHECK_PUBLIC_KEYS
```

## Configuration Validation

### Schema Validation

The configuration is validated using Zod schemas:

```typescript
const FraudConfigSchema = z.object({
  FRAUD_MODE: z.enum(["off", "shadow", "enforce"]).default("shadow"),
  FRAUD_SCORE_THRESHOLD_PURCHASE: z.number().min(0).max(100).default(65),
  FRAUD_SCORE_THRESHOLD_SUBSCRIPTION: z.number().min(0).max(100).default(60),
  FRAUD_BLOCK_COUNTRIES: z.array(z.string().length(2)).default([]),
  FRAUD_ALLOW_TEST_USERS: z.boolean().default(true),
  RATE_LIMITS: z.object({
    perIpPerMin: z.number().default(60),
    perUidPerMin: z.number().default(30),
    perUidPerHour: z.number().default(200),
  }).default({ perIpPerMin: 60, perUidPerMin: 30, perUidPerHour: 200 }),
  BOTDEFENSE: z.object({
    appCheckRequired: z.boolean().default(true),
    recaptchaEnterpriseSiteKey: z.string().optional(),
    minScore: z.number().min(0).max(1).default(0.6),
  }).default({ appCheckRequired: true, minScore: 0.6 }),
});
```

### Runtime Validation

Configuration is validated at startup:

```typescript
// Validate fraud mode
if (config.fraud.FRAUD_MODE === "enforce" && process.env.NODE_ENV === "development") {
  console.warn("⚠️  Fraud enforce mode enabled in development");
}

// Validate thresholds
if (config.fraud.FRAUD_SCORE_THRESHOLD_PURCHASE < 50) {
  console.warn("⚠️  Low purchase threshold may cause false positives");
}

// Validate rate limits
if (config.fraud.RATE_LIMITS.perUidPerMin > 100) {
  console.warn("⚠️  High rate limit may reduce protection");
}
```

## Deployment Configuration

### Development

```bash
# Development settings
FRAUD_MODE=shadow
FRAUD_ALLOW_TEST_USERS=true
FRAUD_SCORE_THRESHOLD_PURCHASE=50
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=45
```

### Staging

```bash
# Staging settings
FRAUD_MODE=shadow
FRAUD_ALLOW_TEST_USERS=false
FRAUD_SCORE_THRESHOLD_PURCHASE=65
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=60
FRAUD_BOTDEFENSE_APP_CHECK_REQUIRED=true
```

### Production

```bash
# Production settings
FRAUD_MODE=shadow  # Start in shadow mode
FRAUD_ALLOW_TEST_USERS=false
FRAUD_SCORE_THRESHOLD_PURCHASE=65
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=60
FRAUD_BOTDEFENSE_APP_CHECK_REQUIRED=true
FRAUD_BOTDEFENSE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_prod_key
```

## Monitoring Configuration

### Log Fields

Structured logs include these fraud-related fields:

```json
{
  "component": "fraud",
  "level": "info",
  "message": "Fraud evaluation completed",
  "mode": "shadow",
  "score": 45,
  "verdict": "allow",
  "threshold": 65,
  "uid": "user123",
  "subjectType": "order",
  "subjectId": "order456",
  "reasons": ["low_velocity", "trusted_country"],
  "processing_ms": 125,
  "signal_count": 3,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Metrics

Key metrics to monitor:

- `fraud_decisions_total` (counter by verdict and mode)
- `fraud_denies_total` (counter)
- `fraud_score_distribution` (distribution of scores)
- `rate_limit_blocks_total` (counter)

### Alerts

Recommended alert thresholds:

- Deny rate > 2% over 10 minutes
- Spike in rate-limit blocks (3× baseline)
- p95 fraud evaluation latency > 150ms
- reCAPTCHA/App Check failure rate > 10% over 10 minutes

## Rollback Configuration

### Quick Rollback

To quickly disable fraud detection:

```bash
FRAUD_MODE=off
```

### Shadow Mode Rollback

To return to shadow mode:

```bash
FRAUD_MODE=shadow
```

### Configuration Rollback

To rollback specific settings:

```bash
# Reset to defaults
FRAUD_SCORE_THRESHOLD_PURCHASE=65
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=60
FRAUD_BLOCK_COUNTRIES=
FRAUD_RATE_LIMITS_PER_IP_PER_MIN=60
FRAUD_RATE_LIMITS_PER_UID_PER_MIN=30
FRAUD_RATE_LIMITS_PER_UID_PER_HOUR=200
```

## Security Considerations

### Secret Management

- All configuration stored in Google Secret Manager
- No secrets in environment variables
- Access controlled via IAM
- Audit logging enabled

### Validation

- All configuration validated at startup
- Type safety with TypeScript
- Runtime validation for critical settings
- Warning logs for suspicious values

### Access Control

- Admin-only access to fraud configuration
- Service account permissions scoped
- Audit trail for configuration changes
- Immutable configuration history
