# Phase 5: Observability Guide

## Overview

This document describes the observability infrastructure for Phase 5 fraud detection, including logging, metrics, alerts, and dashboards.

## Structured Logging

### Log Format

All fraud-related logs use structured JSON format with consistent fields:

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

### Log Fields

#### Required Fields
- `component`: Always "fraud"
- `level`: "info", "warn", "error"
- `message`: Human-readable description
- `timestamp`: ISO 8601 timestamp

#### Fraud-Specific Fields
- `mode`: "shadow", "enforce", "off"
- `score`: Risk score (0-100)
- `verdict`: "allow", "review", "deny"
- `threshold`: Applied threshold
- `uid`: User ID
- `subjectType`: "order", "user", "subscription"
- `subjectId`: Transaction ID
- `reasons`: Array of reason codes
- `processing_ms`: Processing time in milliseconds
- `signal_count`: Number of signals evaluated

#### Context Fields
- `ip_hash`: Hashed IP address (for privacy)
- `device_hash`: Hashed device fingerprint
- `country`: Country code
- `email_domain`: Email domain
- `decision_id`: Unique decision ID
- `signal_ids`: Array of signal IDs

### Log Levels

#### Info Level
- Fraud evaluations completed
- Rate limit checks
- List lookups
- Configuration changes

#### Warn Level
- High processing times
- Unusual decision patterns
- Configuration warnings
- Performance degradation

#### Error Level
- Service failures
- Database errors
- Configuration errors
- Critical system issues

## Metrics

### Counter Metrics

#### fraud_decisions_total
**Description**: Total number of fraud decisions
**Labels**:
- `verdict`: "allow", "review", "deny"
- `mode`: "shadow", "enforce"
- `subject_type`: "order", "user", "subscription"

**Example**:
```
fraud_decisions_total{verdict="allow",mode="shadow",subject_type="order"} 1234
fraud_decisions_total{verdict="deny",mode="enforce",subject_type="order"} 56
```

#### fraud_denies_total
**Description**: Total number of denied transactions
**Labels**:
- `reason`: Primary reason for denial
- `subject_type`: "order", "user", "subscription"

**Example**:
```
fraud_denies_total{reason="rate_limit_exceeded",subject_type="order"} 23
fraud_denies_total{reason="high_risk_score",subject_type="order"} 33
```

#### rate_limit_blocks_total
**Description**: Total number of rate limit blocks
**Labels**:
- `scope`: "ip", "uid"
- `period`: "1m", "1h", "1d"

**Example**:
```
rate_limit_blocks_total{scope="ip",period="1m"} 45
rate_limit_blocks_total{scope="uid",period="1h"} 12
```

### Distribution Metrics

#### fraud_score_distribution
**Description**: Distribution of fraud scores
**Buckets**: 0-10, 10-20, 20-30, 30-40, 40-50, 50-60, 60-70, 70-80, 80-90, 90-100

**Example**:
```
fraud_score_distribution_bucket{le="10"} 1000
fraud_score_distribution_bucket{le="20"} 1500
fraud_score_distribution_bucket{le="30"} 1800
```

#### fraud_processing_time_ms
**Description**: Processing time distribution
**Buckets**: 0-50, 50-100, 100-150, 150-200, 200-250, 250+

**Example**:
```
fraud_processing_time_ms_bucket{le="50"} 800
fraud_processing_time_ms_bucket{le="100"} 1200
fraud_processing_time_ms_bucket{le="150"} 1400
```

### Gauge Metrics

#### manual_reviews_pending
**Description**: Number of pending manual reviews
**Labels**:
- `status`: "open", "in_progress"

**Example**:
```
manual_reviews_pending{status="open"} 15
manual_reviews_pending{status="in_progress"} 3
```

#### fraud_config_mode
**Description**: Current fraud mode
**Values**: 0=off, 1=shadow, 2=enforce

**Example**:
```
fraud_config_mode 1
```

## Alerts

### Critical Alerts

#### High Deny Rate
**Condition**: Deny rate > 2% over 10 minutes
**Severity**: Critical
**Action**: Immediate investigation required

```yaml
alert: HighFraudDenyRate
expr: rate(fraud_denies_total[10m]) / rate(fraud_decisions_total[10m]) > 0.02
for: 5m
labels:
  severity: critical
annotations:
  summary: "High fraud deny rate detected"
  description: "Fraud deny rate is {{ $value }}% over the last 10 minutes"
```

#### System Performance Degradation
**Condition**: p95 processing time > 150ms
**Severity**: Critical
**Action**: Performance investigation required

```yaml
alert: FraudProcessingSlow
expr: histogram_quantile(0.95, rate(fraud_processing_time_ms_bucket[5m])) > 150
for: 5m
labels:
  severity: critical
annotations:
  summary: "Fraud processing is slow"
  description: "p95 processing time is {{ $value }}ms"
```

### Warning Alerts

#### Rate Limit Spike
**Condition**: Rate limit blocks > 3× baseline
**Severity**: Warning
**Action**: Monitor for attack patterns

```yaml
alert: RateLimitSpike
expr: rate(rate_limit_blocks_total[5m]) > 3 * avg_over_time(rate_limit_blocks_total[1h])
for: 2m
labels:
  severity: warning
annotations:
  summary: "Rate limit blocks spiking"
  description: "Rate limit blocks are {{ $value }}x above baseline"
```

#### Manual Review Queue Growing
**Condition**: Pending reviews > 50
**Severity**: Warning
**Action**: Scale review capacity

```yaml
alert: ManualReviewQueueLarge
expr: manual_reviews_pending > 50
for: 10m
labels:
  severity: warning
annotations:
  summary: "Manual review queue is large"
  description: "{{ $value }} reviews pending"
```

#### Bot Defense Failures
**Condition**: reCAPTCHA/App Check failure rate > 10%
**Severity**: Warning
**Action**: Investigate bot defense issues

```yaml
alert: BotDefenseFailures
expr: rate(bot_defense_failures_total[10m]) / rate(bot_defense_checks_total[10m]) > 0.1
for: 5m
labels:
  severity: warning
annotations:
  summary: "Bot defense failure rate high"
  description: "{{ $value }}% failure rate"
```

### Info Alerts

#### Mode Changes
**Condition**: Fraud mode changes
**Severity**: Info
**Action**: Log for audit trail

```yaml
alert: FraudModeChanged
expr: changes(fraud_config_mode[1h]) > 0
for: 0m
labels:
  severity: info
annotations:
  summary: "Fraud mode changed"
  description: "Fraud detection mode has changed"
```

## Dashboards

### Fraud Overview Dashboard

**Purpose**: High-level fraud system health
**Refresh**: 30 seconds
**Panels**:

1. **Decision Rate**
   - Query: `rate(fraud_decisions_total[5m])`
   - Visualization: Line chart
   - Group by: verdict, mode

2. **Score Distribution**
   - Query: `histogram_quantile(0.5, rate(fraud_score_distribution_bucket[5m]))`
   - Visualization: Heatmap
   - Show: Score ranges vs time

3. **Processing Time**
   - Query: `histogram_quantile(0.95, rate(fraud_processing_time_ms_bucket[5m]))`
   - Visualization: Line chart
   - Threshold: 150ms

4. **Rate Limit Blocks**
   - Query: `rate(rate_limit_blocks_total[5m])`
   - Visualization: Line chart
   - Group by: scope, period

### Manual Review Dashboard

**Purpose**: Manual review queue management
**Refresh**: 1 minute
**Panels**:

1. **Pending Reviews**
   - Query: `manual_reviews_pending`
   - Visualization: Gauge
   - Thresholds: 0-25 (green), 25-50 (yellow), 50+ (red)

2. **Review Processing Time**
   - Query: `avg_over_time(review_processing_time_ms[1h])`
   - Visualization: Line chart
   - Show: Average time to process reviews

3. **Review Decisions**
   - Query: `rate(review_decisions_total[1h])`
   - Visualization: Pie chart
   - Group by: decision (approve, reject, escalate)

### Performance Dashboard

**Purpose**: System performance monitoring
**Refresh**: 30 seconds
**Panels**:

1. **Database Operations**
   - Query: `rate(firestore_reads_total[5m])`
   - Visualization: Line chart
   - Show: Read/write operations

2. **Error Rates**
   - Query: `rate(fraud_errors_total[5m])`
   - Visualization: Line chart
   - Group by: error_type

3. **Resource Usage**
   - Query: `rate(container_cpu_usage_seconds_total[5m])`
   - Visualization: Line chart
   - Show: CPU, memory usage

## Log Analysis

### Common Queries

#### Find High-Risk Transactions
```sql
SELECT * FROM fraud_logs 
WHERE score > 80 
AND verdict = 'deny' 
AND timestamp > NOW() - INTERVAL 1 HOUR
ORDER BY score DESC
```

#### Analyze Decision Patterns
```sql
SELECT 
  verdict,
  COUNT(*) as count,
  AVG(score) as avg_score,
  AVG(processing_ms) as avg_time
FROM fraud_logs 
WHERE timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY verdict
```

#### Find Performance Issues
```sql
SELECT * FROM fraud_logs 
WHERE processing_ms > 200 
AND timestamp > NOW() - INTERVAL 1 HOUR
ORDER BY processing_ms DESC
```

#### Track Rate Limit Violations
```sql
SELECT 
  uid,
  COUNT(*) as violations,
  MAX(timestamp) as last_violation
FROM fraud_logs 
WHERE reasons LIKE '%rate_limit%'
AND timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY uid
HAVING violations > 5
```

### Log Retention

#### Retention Policy
- **Raw Logs**: 30 days
- **Aggregated Metrics**: 1 year
- **Alert History**: 90 days
- **Audit Logs**: 1 year

#### Archival Strategy
- **Hot Storage**: Last 7 days (real-time queries)
- **Warm Storage**: 7-30 days (fast queries)
- **Cold Storage**: 30+ days (batch analysis)

## Monitoring Tools

### Primary Tools
- **Logging**: Google Cloud Logging
- **Metrics**: Google Cloud Monitoring
- **Alerts**: Google Cloud Monitoring
- **Dashboards**: Google Cloud Monitoring

### Secondary Tools
- **Log Analysis**: BigQuery
- **Custom Metrics**: Cloud Functions
- **External Monitoring**: Uptime Robot

### Integration
- **Slack**: Alert notifications
- **Email**: Critical alerts
- **PagerDuty**: On-call escalation
- **Jira**: Issue tracking

## Troubleshooting

### Common Issues

#### Missing Metrics
**Symptoms**: Metrics not appearing in dashboards
**Causes**: 
- Service not running
- Configuration errors
- Network issues

**Solutions**:
1. Check service status
2. Verify configuration
3. Check network connectivity
4. Review logs for errors

#### High Latency
**Symptoms**: Processing times > 250ms
**Causes**:
- Database performance issues
- High system load
- Network latency

**Solutions**:
1. Check database performance
2. Monitor system resources
3. Optimize queries
4. Scale resources if needed

#### Alert Fatigue
**Symptoms**: Too many false positive alerts
**Causes**:
- Alert thresholds too low
- Insufficient alert grouping
- Poor alert conditions

**Solutions**:
1. Adjust alert thresholds
2. Group related alerts
3. Improve alert conditions
4. Add alert suppression rules

### Debug Procedures

#### Check System Health
```bash
# Check service status
curl -f http://localhost:8080/health

# Check metrics endpoint
curl http://localhost:8080/metrics

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fraud-service"
```

#### Validate Configuration
```bash
# Check fraud configuration
curl http://localhost:8080/api/trpc/fraud.admin.config

# Check rate limits
curl http://localhost:8080/api/trpc/fraud.admin.stats.rateLimits
```

#### Performance Analysis
```bash
# Check processing times
curl "http://localhost:8080/api/trpc/fraud.admin.stats.performance?hours=1"

# Check database queries
gcloud logging read "resource.type=cloud_run_revision AND jsonPayload.message:database"
```
