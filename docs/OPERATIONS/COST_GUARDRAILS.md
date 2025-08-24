# Cost Guardrails for Phase 6B

**Created**: 2025-01-10  
**Status**: ✅ **ACTIVE** - Cost monitoring and alerts

---

## Budget Alerts

### Pub/Sub Egress Costs
- **Alert Threshold**: $50/month (baseline: $15/month)
- **Metric**: `pubsub.googleapis.com/topic/byte_cost`
- **Action**: Investigate if egress exceeds normal patterns

### Cloud Run CPU Minutes
- **Alert Threshold**: 100,000 minutes/month (baseline: 30,000 minutes/month)
- **Metric**: `run.googleapis.com/container/cpu/utilizations`
- **Action**: Review autoscaling settings and optimize worker efficiency

### Firestore Operations
- **Alert Threshold**: 1M reads/month, 100K writes/month
- **Metric**: `firestore.googleapis.com/document/read_count`, `firestore.googleapis.com/document/write_count`
- **Action**: Check for inefficient queries or excessive writes

---

## Expected Cost Bands

### Current Traffic (Baseline)
| Service | Monthly Cost | Usage |
|---------|-------------|-------|
| **Pub/Sub** | $15 | 10 RPS average |
| **Cloud Run** | $45 | 30K CPU minutes |
| **Firestore** | $25 | 500K reads, 50K writes |
| **Monitoring** | $10 | Standard metrics |
| **Total** | **$95** | Baseline operations |

### 2x Traffic (Peak Load)
| Service | Monthly Cost | Usage |
|---------|-------------|-------|
| **Pub/Sub** | $25 | 20 RPS average |
| **Cloud Run** | $75 | 60K CPU minutes |
| **Firestore** | $40 | 1M reads, 100K writes |
| **Monitoring** | $15 | Enhanced metrics |
| **Total** | **$155** | Peak operations |

### 5x Traffic (Burst Load)
| Service | Monthly Cost | Usage |
|---------|-------------|-------|
| **Pub/Sub** | $50 | 50 RPS average |
| **Cloud Run** | $150 | 120K CPU minutes |
| **Firestore** | $75 | 2.5M reads, 250K writes |
| **Monitoring** | $25 | Full observability |
| **Total** | **$300** | Burst operations |

---

## Cost Optimization Strategies

### Autoscaling Optimization
- **Scale to Zero**: Saves ~60% during low traffic periods
- **Concurrency Tuning**: Optimal at 80 concurrent requests
- **CPU Target**: 70% utilization for cost/performance balance

### Pub/Sub Optimization
- **Message Batching**: Reduce per-message overhead
- **Retention Policy**: 7-day retention (vs 30-day default)
- **Dead Letter Queue**: Minimal retention for failed messages

### Firestore Optimization
- **Index Optimization**: Only necessary composite indexes
- **TTL Management**: 90-day retention for webhook events
- **Batch Operations**: Group writes where possible

---

## Alert Policies

### Budget Alert (Critical)
```yaml
displayName: "Phase 6B: Monthly Budget Exceeded"
condition:
  displayName: "Monthly cost > $200"
  conditionThreshold:
    filter: 'metric.type="billing.googleapis.com/budget/budget_amount"'
    metric: 'billing.googleapis.com/budget/budget_amount'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 200
    duration: 86400s  # 24 hours
notificationChannels:
  - "cost-alerts@company.com"
```

### Pub/Sub Cost Alert (Warning)
```yaml
displayName: "Phase 6B: Pub/Sub Cost Spike"
condition:
  displayName: "Pub/Sub cost > $30 in 24h"
  conditionThreshold:
    filter: 'resource.type="pubsub_topic"'
    metric: 'pubsub.googleapis.com/topic/byte_cost'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 30
    duration: 86400s
notificationChannels:
  - "ops-alerts@company.com"
```

### Cloud Run Cost Alert (Warning)
```yaml
displayName: "Phase 6B: Cloud Run Cost Spike"
condition:
  displayName: "Cloud Run CPU minutes > 5000 in 24h"
  conditionThreshold:
    filter: 'resource.type="cloud_run_revision"'
    metric: 'run.googleapis.com/container/cpu/utilizations'
    comparison: COMPARISON_GREATER_THAN
    thresholdValue: 5000
    duration: 86400s
notificationChannels:
  - "ops-alerts@company.com"
```

---

## Cost Monitoring Dashboard

### Key Metrics
- **Daily Cost Trend**: Track spending patterns
- **Service Breakdown**: Pub/Sub vs Cloud Run vs Firestore
- **Cost per Request**: Normalize by traffic volume
- **Autoscaling Efficiency**: CPU utilization vs cost

### Cost Anomaly Detection
- **Spike Detection**: >50% increase in daily costs
- **Trend Analysis**: Weekly cost growth patterns
- **Service Correlation**: Link cost spikes to traffic events

---

## Cost Optimization Checklist

### Monthly Review
- [ ] Review autoscaling settings
- [ ] Analyze Pub/Sub message patterns
- [ ] Check Firestore query efficiency
- [ ] Validate TTL policies
- [ ] Review monitoring costs

### Quarterly Optimization
- [ ] Right-size Cloud Run instances
- [ ] Optimize Pub/Sub retention
- [ ] Review Firestore indexes
- [ ] Update cost thresholds
- [ ] Plan capacity upgrades

---

## Emergency Cost Controls

### Immediate Actions (Cost > $500/month)
1. **Reduce Autoscaling**: Set max instances to 5
2. **Increase TTL**: Reduce webhook retention to 30 days
3. **Disable Load Shedding**: Reduce monitoring overhead
4. **Review Traffic**: Check for abuse or unexpected load

### Rollback Plan
1. **Scale Down**: Reduce worker instances
2. **Optimize Queries**: Review Firestore usage
3. **Message Batching**: Group Pub/Sub messages
4. **Cost Monitoring**: Enhanced daily reviews

---

**Last Updated**: 2025-01-10  
**Next Review**: 2025-02-10
