# Phase 5 Fraud Detection Runbook

## Overview
This runbook covers operational procedures for the Phase 5 fraud detection system, including monitoring, alerting, and incident response.

## Weekly Canary Comparison

### Purpose
The 1% shadow canary routes 1% of fraud evaluations to shadow mode while the rest go to enforce mode. This allows us to compare decision consistency and detect any drift between modes.

### Monitoring Schedule
- **Frequency**: Weekly (every Monday)
- **Data Source**: `riskDecisions` collection with `canary=true` filter
- **Comparison Period**: Last 7 days

### Metrics to Compare
1. **Decision Distribution**
   - Enforce mode: allow/deny/review percentages
   - Shadow mode: allow/deny/review percentages
   - Expected: Similar distributions for benign traffic

2. **Score Distribution**
   - Enforce mode: average score, p50, p95
   - Shadow mode: average score, p50, p95
   - Expected: Similar score distributions

3. **Processing Performance**
   - Enforce mode: p95 processing time
   - Shadow mode: p95 processing time
   - Expected: Similar performance (within 10ms)

### Analysis Query
```sql
-- Weekly canary comparison
SELECT 
  mode,
  canary,
  COUNT(*) as total_decisions,
  AVG(score) as avg_score,
  PERCENTILE_CONT(score, 0.5) OVER (PARTITION BY mode, canary) as p50_score,
  PERCENTILE_CONT(score, 0.95) OVER (PARTITION BY mode, canary) as p95_score,
  AVG(processing_ms) as avg_processing_ms,
  PERCENTILE_CONT(processing_ms, 0.95) OVER (PARTITION BY mode, canary) as p95_processing_ms,
  COUNTIF(verdict = 'allow') / COUNT(*) as allow_rate,
  COUNTIF(verdict = 'deny') / COUNT(*) as deny_rate,
  COUNTIF(verdict = 'review') / COUNT(*) as review_rate
FROM `siraj-prod.fraud.risk_decisions`
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND (mode = 'enforce' OR canary = true)
GROUP BY mode, canary
ORDER BY mode, canary;
```

### Alert Thresholds
- **Decision Rate Drift**: >5% difference in allow/deny rates between modes
- **Score Drift**: >10% difference in average scores between modes
- **Performance Drift**: >20ms difference in p95 processing times

### Action Items
- **Minor Drift (<5%)**: Monitor for another week
- **Moderate Drift (5-10%)**: Investigate signal collection or scoring changes
- **Major Drift (>10%)**: Immediate investigation and potential rollback

### Documentation
- Store weekly comparison results in `docs/STATUS/CANARY_COMPARISON_YYYY-MM-DD.md`
- Update this runbook with any pattern changes or threshold adjustments

## Emergency Procedures

### Quick Disable Fraud Detection

**Scenario**: Fraud system is blocking legitimate users or causing issues

**Action**:
```bash
# Set fraud mode to off
FRAUD_MODE=off
```

**Verification**:
- Check logs for "Fraud evaluation completed" messages
- Verify webhook processing continues normally
- Monitor error rates

### Rollback to Shadow Mode

**Scenario**: Need to stop blocking but continue monitoring

**Action**:
```bash
# Set fraud mode to shadow
FRAUD_MODE=shadow
```

**Verification**:
- Check logs for fraud evaluations continuing
- Verify no transactions are being blocked
- Monitor decision patterns

### Adjust Thresholds

**Scenario**: Too many false positives or negatives

**Action**:
```bash
# Increase thresholds to reduce false positives
FRAUD_SCORE_THRESHOLD_PURCHASE=75
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=70

# Decrease thresholds to catch more fraud
FRAUD_SCORE_THRESHOLD_PURCHASE=55
FRAUD_SCORE_THRESHOLD_SUBSCRIPTION=50
```

**Verification**:
- Monitor decision rates
- Check manual review queue
- Review false positive/negative reports

## Daily Operations

### Monitor Fraud Dashboard

**Check Daily**:
1. **Decision Rates**: Review allow/deny/review percentages
2. **Score Distribution**: Look for unusual patterns
3. **Manual Review Queue**: Process pending reviews
4. **Rate Limit Blocks**: Check for unusual spikes
5. **Processing Times**: Ensure < 250ms average

**Alerts to Watch**:
- Deny rate > 2% over 10 minutes
- Spike in rate-limit blocks (3× baseline)
- p95 fraud evaluation latency > 150ms
- reCAPTCHA/App Check failure rate > 10%

### Process Manual Reviews

**Review Queue Management**:
1. **Check Queue**: `/admin/fraud/reviews`
2. **Prioritize**: High-value transactions first
3. **Investigate**: Review evidence and signals
4. **Decide**: Approve, reject, or request more info
5. **Document**: Add notes for future reference

**Review Criteria**:
- **Approve**: Legitimate user, low risk indicators
- **Reject**: Clear fraud indicators, high risk
- **Request Info**: Unclear case, need more data

### Manage Allow/Deny Lists

**Adding to Denylist**:
```bash
# Via admin interface
/admin/fraud/lists

# Via API (admin only)
POST /api/trpc/fraud.admin.addToDenylist
{
  "type": "uid",
  "value": "user123",
  "reason": "Confirmed fraud",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Adding to Allowlist**:
```bash
# Via admin interface
/admin/fraud/lists

# Via API (admin only)
POST /api/trpc/fraud.admin.addToAllowlist
{
  "type": "uid",
  "value": "user456",
  "reason": "VIP customer",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Bulk Operations**:
1. **Export**: Download current lists
2. **Edit**: Modify in spreadsheet
3. **Import**: Upload via admin interface
4. **Verify**: Check for errors

## Weekly Operations

### Review Performance Metrics

**Metrics to Review**:
- **Decision Accuracy**: False positive/negative rates
- **Processing Performance**: Average and p95 times
- **Resource Usage**: Database reads/writes
- **User Impact**: Blocked legitimate users

**Actions**:
- Adjust thresholds if needed
- Optimize queries if performance degrades
- Update allow/deny lists based on patterns
- Plan capacity for manual reviews

### Update Block Lists

**Country Blocking**:
```bash
# Add countries to block
FRAUD_BLOCK_COUNTRIES=XX,YY,ZZ

# Remove countries from block
FRAUD_BLOCK_COUNTRIES=XX,YY
```

**Email Domain Blocking**:
```bash
# Add via admin interface
/admin/fraud/lists

# Add high-risk domains
type: emailDomain
value: tempmail.com
reason: Temporary email service
```

### Review and Clean Up

**Data Cleanup**:
- **Expired Entries**: Remove expired allow/deny list entries
- **Old Decisions**: Archive decisions older than 90 days
- **Unused Signals**: Clean up orphaned fraud signals

**Maintenance Tasks**:
```bash
# Clean up expired entries
POST /api/trpc/fraud.admin.cleanupExpired

# Archive old data
# (Implement based on your retention policy)
```

## Monthly Operations

### Comprehensive Review

**Review Period**: Last 30 days

**Analysis**:
1. **Fraud Patterns**: Identify new attack vectors
2. **False Positives**: Users incorrectly blocked
3. **False Negatives**: Fraud that got through
4. **Performance Trends**: System performance over time
5. **Resource Usage**: Database and compute costs

**Actions**:
- Update scoring algorithm if needed
- Adjust thresholds based on patterns
- Add new signals for emerging threats
- Optimize performance bottlenecks

### Update Documentation

**Review and Update**:
- **Runbook**: Update procedures based on learnings
- **Configuration**: Document new settings
- **Alerts**: Adjust thresholds based on experience
- **Training**: Update team training materials

### Capacity Planning

**Review Capacity**:
- **Manual Review Queue**: Average processing time
- **Admin Resources**: Staff needed for reviews
- **System Resources**: Database and compute usage
- **Storage**: Data retention and archiving needs

**Plan for Growth**:
- Scale manual review capacity
- Optimize automated processes
- Plan for increased transaction volume

## Incident Response

### Fraud Detection Bypass

**Symptoms**:
- Unusual transaction patterns
- High-value transactions from new users
- Multiple accounts from same IP/device

**Response**:
1. **Immediate**: Add IP/device to denylist
2. **Investigate**: Review recent decisions
3. **Adjust**: Lower thresholds temporarily
4. **Monitor**: Watch for similar patterns
5. **Document**: Update threat intelligence

### System Performance Issues

**Symptoms**:
- High fraud evaluation latency
- Database connection errors
- Rate limiting failures

**Response**:
1. **Check**: System resources and logs
2. **Scale**: Increase compute resources if needed
3. **Optimize**: Review database queries
4. **Monitor**: Watch for recurrence
5. **Document**: Update capacity planning

### False Positive Outbreak

**Symptoms**:
- Multiple legitimate users blocked
- Customer support complaints
- High manual review queue

**Response**:
1. **Immediate**: Switch to shadow mode
2. **Investigate**: Review recent decisions
3. **Adjust**: Increase thresholds
4. **Notify**: Alert affected users
5. **Monitor**: Watch decision patterns

## Troubleshooting

### Common Issues

**High False Positive Rate**:
- **Cause**: Thresholds too low
- **Solution**: Increase thresholds gradually
- **Prevention**: Monitor decision patterns

**High False Negative Rate**:
- **Cause**: Thresholds too high
- **Solution**: Decrease thresholds gradually
- **Prevention**: Review fraud patterns

**Performance Degradation**:
- **Cause**: Database query issues
- **Solution**: Review and optimize queries
- **Prevention**: Monitor performance metrics

**Rate Limiting Issues**:
- **Cause**: Shard hot-spots
- **Solution**: Adjust sharding strategy
- **Prevention**: Monitor rate limit patterns

### Debug Commands

**Check Fraud Status**:
```bash
# Check current configuration
GET /api/trpc/fraud.admin.config

# Check recent decisions
GET /api/trpc/fraud.admin.stats.decisions?days=1

# Check manual review queue
GET /api/trpc/fraud.admin.reviews.list
```

**Check System Health**:
```bash
# Check database connections
# Check processing times
# Check error rates
```

## Escalation Procedures

### Level 1: On-Call Engineer
- **Scope**: System issues, performance problems
- **Actions**: Restart services, adjust configuration
- **Escalation**: If unresolved in 30 minutes

### Level 2: Senior Engineer
- **Scope**: Complex issues, data problems
- **Actions**: Deep investigation, code changes
- **Escalation**: If unresolved in 2 hours

### Level 3: Engineering Manager
- **Scope**: Business impact, strategic decisions
- **Actions**: Coordinate response, make decisions
- **Escalation**: If unresolved in 4 hours

### Level 4: CTO/VP Engineering
- **Scope**: Critical business impact
- **Actions**: Strategic decisions, external coordination
- **Escalation**: If unresolved in 8 hours

## Contact Information

### Primary Contacts
- **On-Call**: [On-call engineer contact]
- **Fraud Team**: [Fraud team contact]
- **Engineering Manager**: [Manager contact]

### Escalation Contacts
- **CTO**: [CTO contact]
- **VP Engineering**: [VP contact]

### External Contacts
- **PayNow Support**: [PayNow contact]
- **Firebase Support**: [Firebase contact]
- **Google Cloud Support**: [GCP contact]
