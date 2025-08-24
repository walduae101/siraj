# Phase 5 Observability Guide

## SLOs (Service Level Objectives)

### Availability SLO
- **Metric**: Webhook p95 response time
- **Target**: < 250ms (rolling 30m)
- **Burn Rate**: 5% error budget per hour
- **Alert**: `webhook_p95_slo_burn_rate`

### Fraud Latency SLO
- **Metric**: Fraud evaluation p95 processing time
- **Target**: < 150ms
- **Burn Rate**: 5% error budget per hour
- **Alert**: `fraud_latency_slo_burn_rate`

### Quality SLO
- **Metric**: Deny rate
- **Target**: ≤ 1.0%
- **Burn Rate**: 10% error budget per hour
- **Alert**: `fraud_quality_slo_burn_rate`

## Alert Policies

### Fast Burn Rate Alerts (5-minute windows)
1. **webhook_p95_slo_burn_rate_fast**
   - Condition: webhook p95 > 250ms for 5 consecutive minutes
   - Severity: P1
   - Notification: Slack #fraud-alerts, PagerDuty

2. **fraud_latency_slo_burn_rate_fast**
   - Condition: fraud eval p95 > 150ms for 5 consecutive minutes
   - Severity: P1
   - Notification: Slack #fraud-alerts, PagerDuty

3. **fraud_quality_slo_burn_rate_fast**
   - Condition: deny rate > 1.0% for 5 consecutive minutes
   - Severity: P2
   - Notification: Slack #fraud-alerts

### Slow Burn Rate Alerts (1-hour windows)
1. **webhook_p95_slo_burn_rate_slow**
   - Condition: webhook p95 > 250ms for 1 hour
   - Severity: P2
   - Notification: Slack #fraud-alerts

2. **fraud_latency_slo_burn_rate_slow**
   - Condition: fraud eval p95 > 150ms for 1 hour
   - Severity: P2
   - Notification: Slack #fraud-alerts

3. **fraud_quality_slo_burn_rate_slow**
   - Condition: deny rate > 1.0% for 1 hour
   - Severity: P3
   - Notification: Slack #fraud-alerts

## Dashboard Tiles

### SLO Tiles
1. **Webhook Availability**
   - Metric: `webhook_p95_response_time`
   - Target: 250ms
   - Display: Line chart with target line

2. **Fraud Latency**
   - Metric: `fraud_evaluation_p95_processing_time`
   - Target: 150ms
   - Display: Line chart with target line

3. **Fraud Quality**
   - Metric: `fraud_deny_rate`
   - Target: 1.0%
   - Display: Line chart with target line

### Burn Rate Tiles
1. **Error Budget Burn Rate**
   - Metric: Error budget consumption rate
   - Display: Gauge chart showing remaining budget

2. **SLO Status**
   - Metric: SLO compliance status
   - Display: Status indicators (Green/Yellow/Red)

## Log-based Metrics

### Fraud Decisions
- `fraud_decisions_total{verdict, mode, canary}`
- `fraud_denies_total{mode, canary}`
- `fraud_score_distribution{mode, canary}`

### Performance
- `fraud_evaluation_duration_seconds{mode, canary}`
- `webhook_response_time_seconds`
- `rate_limit_blocks_total{scope}`

### Quality
- `fraud_false_positive_rate{mode}`
- `manual_reviews_total{status}`
- `app_check_failure_rate`

## Monitoring Queries

### SLO Compliance
```sql
-- Webhook availability SLO
SELECT 
  AVG(CASE WHEN response_time_ms <= 250 THEN 1 ELSE 0 END) as slo_compliance
FROM `siraj-prod.logs.webhook_requests`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE);
```

### Burn Rate Calculation
```sql
-- Fraud quality burn rate
SELECT 
  COUNTIF(verdict = 'deny') / COUNT(*) as deny_rate,
  TIMESTAMP_TRUNC(timestamp, MINUTE) as minute
FROM `siraj-prod.fraud.risk_decisions`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY minute
ORDER BY minute;
```
