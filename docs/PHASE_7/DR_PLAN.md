# Phase 7: Multi-Region Readiness - Disaster Recovery Plan

**Updated on: 2025-01-10**

---

## Overview

This document provides comprehensive disaster recovery procedures for Phase 7 multi-region webhook system, including automatic failover, manual intervention, and GameDay drills.

---

## DR Architecture

### Failover Scenarios
1. **Single Region Outage**: Automatic failover to healthy region
2. **Load Balancer Failure**: DNS failover to backup LB
3. **Database Issues**: Firestore global availability
4. **Complete Regional Failure**: Manual failover procedures

### Recovery Time Objectives (RTO)
- **Automatic Failover**: < 30 seconds
- **Manual Failover**: < 5 minutes
- **Complete Recovery**: < 15 minutes
- **Rollback**: < 10 minutes

### Recovery Point Objectives (RPO)
- **Data Loss**: 0 (Firestore is global)
- **Event Processing**: < 1 minute
- **Configuration**: < 5 minutes

---

## Automatic Failover

### Health Check Configuration
```yaml
# Webhook Health Check
path: /health
port: 443
protocol: HTTPS
interval: 10s
timeout: 5s
healthy_threshold: 2
unhealthy_threshold: 3

# Worker Health Check
path: /health
port: 443
protocol: HTTPS
interval: 10s
timeout: 5s
healthy_threshold: 2
unhealthy_threshold: 3
```

### Failover Triggers
- **Service Unhealthy**: 3 consecutive health check failures
- **High Error Rate**: > 5% 5xx errors for 2 minutes
- **High Latency**: p95 > 500ms for 5 minutes
- **Resource Exhaustion**: CPU > 90% or memory > 95%

### Failover Process
1. **Detection**: Load balancer detects unhealthy backend
2. **Traffic Shift**: Automatic routing to healthy backend
3. **Monitoring**: Continuous health monitoring
4. **Recovery**: Automatic restoration when healthy

---

## Manual Failover Procedures

### Webhook Service Failover

#### Scenario: us-central1 Webhook Outage
**Symptoms**:
- High error rate from US webhook
- Health checks failing
- Performance degradation

**Immediate Actions**:
1. **Verify EU Health**:
   ```bash
   curl -I https://siraj-webhook-eu-{project}.run.app/health
   ```

2. **Disable US Backend**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --remove-backend=us-backend \
     --global
   ```

3. **Verify Traffic Routing**:
   ```bash
   curl -I https://hooks.siraj.life/api/paynow/webhook
   ```

4. **Monitor Metrics**:
   - Webhook success rate
   - EU region performance
   - Error rates

**Recovery Steps**:
1. **Fix US Service**: Resolve underlying issue
2. **Verify Health**: Confirm US service healthy
3. **Re-enable Backend**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --add-backend=us-backend \
     --global
   ```
4. **Monitor Traffic**: Verify balanced distribution

#### Scenario: europe-west1 Webhook Outage
**Symptoms**:
- High error rate from EU webhook
- Health checks failing
- Performance degradation

**Immediate Actions**:
1. **Verify US Health**:
   ```bash
   curl -I https://siraj-webhook-us-{project}.run.app/health
   ```

2. **Disable EU Backend**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --remove-backend=eu-backend \
     --global
   ```

3. **Verify Traffic Routing**:
   ```bash
   curl -I https://hooks.siraj.life/api/paynow/webhook
   ```

4. **Monitor Metrics**:
   - Webhook success rate
   - US region performance
   - Error rates

**Recovery Steps**:
1. **Fix EU Service**: Resolve underlying issue
2. **Verify Health**: Confirm EU service healthy
3. **Re-enable Backend**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --add-backend=eu-backend \
     --global
   ```
4. **Monitor Traffic**: Verify balanced distribution

### Worker Service Failover

#### Scenario: us-central1 Worker Outage
**Symptoms**:
- DLQ growth
- Messages not being processed
- Worker health checks failing

**Immediate Actions**:
1. **Verify EU Worker Health**:
   ```bash
   curl -I https://siraj-worker-eu-{project}.run.app/health
   ```

2. **Check Pub/Sub Subscription**:
   ```bash
   gcloud pubsub subscriptions describe paynow-events-sub
   ```

3. **Monitor DLQ**:
   ```bash
   gcloud pubsub subscriptions describe paynow-events-dlq
   ```

4. **Verify Processing**:
   - Check EU worker logs
   - Monitor message processing rate
   - Verify idempotency

**Recovery Steps**:
1. **Fix US Worker**: Resolve underlying issue
2. **Verify Health**: Confirm US worker healthy
3. **Monitor Processing**: Verify message processing resumes
4. **Check DLQ**: Ensure backlog is cleared

#### Scenario: europe-west1 Worker Outage
**Symptoms**:
- DLQ growth
- Messages not being processed
- Worker health checks failing

**Immediate Actions**:
1. **Verify US Worker Health**:
   ```bash
   curl -I https://siraj-worker-us-{project}.run.app/health
   ```

2. **Check Pub/Sub Subscription**:
   ```bash
   gcloud pubsub subscriptions describe paynow-events-sub
   ```

3. **Monitor DLQ**:
   ```bash
   gcloud pubsub subscriptions describe paynow-events-dlq
   ```

4. **Verify Processing**:
   - Check US worker logs
   - Monitor message processing rate
   - Verify idempotency

**Recovery Steps**:
1. **Fix EU Worker**: Resolve underlying issue
2. **Verify Health**: Confirm EU worker healthy
3. **Monitor Processing**: Verify message processing resumes
4. **Check DLQ**: Ensure backlog is cleared

---

## Load Balancer Failover

### Primary LB Failure
**Symptoms**:
- 5xx errors from LB endpoints
- SSL certificate issues
- Configuration errors

**Immediate Actions**:
1. **Check LB Health**:
   ```bash
   gcloud compute url-maps describe siraj-webhook-lb
   gcloud compute url-maps describe siraj-worker-lb
   ```

2. **Verify Backend Health**:
   ```bash
   gcloud compute backend-services describe siraj-webhook-us-backend
   gcloud compute backend-services describe siraj-worker-us-backend
   ```

3. **Update DNS to Backup LB**:
   ```bash
   gcloud dns record-sets update A hooks.siraj.life \
     --rrdatas=BACKUP_LB_IP \
     --zone=siraj-life
   
   gcloud dns record-sets update A worker.siraj.life \
     --rrdatas=BACKUP_LB_IP \
     --zone=siraj-life
   ```

4. **Monitor Service Availability**:
   - Verify webhook delivery
   - Check worker processing
   - Monitor performance metrics

**Recovery Steps**:
1. **Fix Primary LB**: Resolve configuration issues
2. **Verify Health**: Confirm LB is healthy
3. **Update DNS Back**:
   ```bash
   gcloud dns record-sets update A hooks.siraj.life \
     --rrdatas=PRIMARY_LB_IP \
     --zone=siraj-life
   
   gcloud dns record-sets update A worker.siraj.life \
     --rrdatas=PRIMARY_LB_IP \
     --zone=siraj-life
   ```
4. **Monitor Traffic**: Verify routing is restored

---

## Database Issues

### Firestore Global Issues
**Symptoms**:
- Database connection errors
- High latency
- Quota exceeded errors

**Immediate Actions**:
1. **Check Firestore Status**:
   - Visit [Firestore Status Page](https://status.firebase.google.com/)
   - Check project quotas
   - Review recent changes

2. **Verify Service Accounts**:
   ```bash
   gcloud iam service-accounts list
   gcloud projects get-iam-policy walduae-project-20250809071906
   ```

3. **Check Resource Usage**:
   ```bash
   gcloud firestore indexes list
   gcloud firestore collections list
   ```

4. **Monitor Error Patterns**:
   - Check logs for specific error types
   - Identify affected operations
   - Assess impact scope

**Recovery Steps**:
1. **Wait for Recovery**: Most issues resolve automatically
2. **Scale Resources**: If quota exceeded, request increase
3. **Verify Connectivity**: Test database operations
4. **Monitor Performance**: Ensure normal operation

---

## Complete Regional Failure

### us-central1 Complete Outage
**Symptoms**:
- All US services unavailable
- Health checks failing across US region
- Network connectivity issues

**Immediate Actions**:
1. **Verify EU Services**:
   ```bash
   curl -I https://siraj-webhook-eu-{project}.run.app/health
   curl -I https://siraj-worker-eu-{project}.run.app/health
   ```

2. **Disable US Backends**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --remove-backend=us-backend \
     --global
   
   gcloud compute backend-services update siraj-worker-us-backend \
     --remove-backend=us-worker-backend \
     --global
   ```

3. **Update DNS if Needed**:
   ```bash
   gcloud dns record-sets update A hooks.siraj.life \
     --rrdatas=EU_LB_IP \
     --zone=siraj-life
   ```

4. **Monitor EU Performance**:
   - Check EU region capacity
   - Monitor performance metrics
   - Verify service availability

**Recovery Steps**:
1. **Wait for US Recovery**: Monitor US region status
2. **Verify US Services**: Test US service health
3. **Re-enable US Backends**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --add-backend=us-backend \
     --global
   
   gcloud compute backend-services update siraj-worker-us-backend \
     --add-backend=us-worker-backend \
     --global
   ```
4. **Restore DNS**: Update DNS back to primary LB
5. **Monitor Traffic**: Verify balanced distribution

### europe-west1 Complete Outage
**Symptoms**:
- All EU services unavailable
- Health checks failing across EU region
- Network connectivity issues

**Immediate Actions**:
1. **Verify US Services**:
   ```bash
   curl -I https://siraj-webhook-us-{project}.run.app/health
   curl -I https://siraj-worker-us-{project}.run.app/health
   ```

2. **Disable EU Backends**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --remove-backend=eu-backend \
     --global
   
   gcloud compute backend-services update siraj-worker-us-backend \
     --remove-backend=eu-worker-backend \
     --global
   ```

3. **Monitor US Performance**:
   - Check US region capacity
   - Monitor performance metrics
   - Verify service availability

**Recovery Steps**:
1. **Wait for EU Recovery**: Monitor EU region status
2. **Verify EU Services**: Test EU service health
3. **Re-enable EU Backends**:
   ```bash
   gcloud compute backend-services update siraj-webhook-us-backend \
     --add-backend=eu-backend \
     --global
   
   gcloud compute backend-services update siraj-worker-us-backend \
     --add-backend=eu-worker-backend \
     --global
   ```
4. **Monitor Traffic**: Verify balanced distribution

---

## Emergency Rollback

### Feature Flag Rollback
**Trigger**: Critical issues with multi-region functionality

**Immediate Actions**:
1. **Disable Multi-Region**:
   ```bash
   # Update config to disable multi-region
   gcloud secrets versions add siraj-config \
     --data-file=config-single-region.json
   ```

2. **Verify Rollback**:
   ```bash
   curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     https://secretmanager.googleapis.com/v1/projects/walduae-project-20250809071906/secrets/siraj-config/versions/latest:access
   ```

3. **Monitor Service Health**:
   - Check webhook processing
   - Verify worker processing
   - Monitor error rates

### Complete Rollback
**Trigger**: Severe issues requiring full rollback

**Immediate Actions**:
1. **Update DNS to Single Region**:
   ```bash
   gcloud dns record-sets update A hooks.siraj.life \
     --rrdatas=SINGLE_REGION_IP \
     --zone=siraj-life
   
   gcloud dns record-sets update A worker.siraj.life \
     --rrdatas=SINGLE_REGION_IP \
     --zone=siraj-life
   ```

2. **Update Pub/Sub Subscription**:
   ```bash
   gcloud pubsub subscriptions update paynow-events-sub \
     --push-endpoint=https://siraj-worker-us-{project}.run.app/api/tasks/paynow/process
   ```

3. **Disable Multi-Region Features**:
   ```bash
   gcloud secrets versions add siraj-config \
     --data-file=config-single-region.json
   ```

4. **Verify Rollback**:
   - Test webhook delivery
   - Verify worker processing
   - Check performance metrics

---

## GameDay Drills

### Quarterly Schedule
- **Q1 2025**: Region failover drill
- **Q2 2025**: DLQ replay drill
- **Q3 2025**: Config rollback drill
- **Q4 2025**: Complete DR drill

### Drill 1: Region Failover (Q1 2025)

#### Objectives
- Test automatic failover procedures
- Validate manual failover steps
- Verify monitoring and alerting
- Train operations team

#### Scenario
- Simulate us-central1 webhook service outage
- Test automatic failover to europe-west1
- Validate manual intervention procedures
- Test recovery and restoration

#### Steps
1. **Preparation**:
   - Notify stakeholders
   - Prepare monitoring dashboards
   - Set up communication channels
   - Brief operations team

2. **Execution**:
   - Simulate US webhook service failure
   - Monitor automatic failover
   - Execute manual failover procedures
   - Test recovery steps

3. **Validation**:
   - Verify traffic routing
   - Check performance metrics
   - Validate error handling
   - Test restoration procedures

4. **Documentation**:
   - Record lessons learned
   - Update procedures
   - Identify improvements
   - Schedule follow-up actions

#### Success Criteria
- ✅ Automatic failover < 30 seconds
- ✅ Manual failover < 5 minutes
- ✅ Zero data loss
- ✅ Performance within SLOs
- ✅ Team trained and confident

### Drill 2: DLQ Replay (Q2 2025)

#### Objectives
- Test DLQ processing procedures
- Validate message replay capabilities
- Verify idempotency handling
- Test error classification

#### Scenario
- Generate test messages in DLQ
- Execute DLQ replay procedures
- Validate message processing
- Test error handling

#### Steps
1. **Preparation**:
   - Create test messages in DLQ
   - Prepare replay procedures
   - Set up monitoring
   - Brief operations team

2. **Execution**:
   - Execute DLQ replay
   - Monitor message processing
   - Validate idempotency
   - Test error handling

3. **Validation**:
   - Verify message processing
   - Check for duplicates
   - Validate error classification
   - Test recovery procedures

4. **Documentation**:
   - Record lessons learned
   - Update procedures
   - Identify improvements
   - Schedule follow-up actions

#### Success Criteria
- ✅ All messages processed
- ✅ No duplicate credits
- ✅ Proper error classification
- ✅ Performance within SLOs

### Drill 3: Config Rollback (Q3 2025)

#### Objectives
- Test configuration rollback procedures
- Validate feature flag management
- Verify service restoration
- Test monitoring and alerting

#### Scenario
- Simulate configuration issues
- Test rollback procedures
- Validate service restoration
- Test monitoring recovery

#### Steps
1. **Preparation**:
   - Prepare rollback configurations
   - Set up monitoring
   - Brief operations team
   - Prepare communication plan

2. **Execution**:
   - Simulate configuration issues
   - Execute rollback procedures
   - Validate service restoration
   - Test monitoring recovery

3. **Validation**:
   - Verify service health
   - Check performance metrics
   - Validate configuration
   - Test monitoring alerts

4. **Documentation**:
   - Record lessons learned
   - Update procedures
   - Identify improvements
   - Schedule follow-up actions

#### Success Criteria
- ✅ Rollback < 10 minutes
- ✅ Service health restored
- ✅ Performance within SLOs
- ✅ Monitoring functional

### Drill 4: Complete DR (Q4 2025)

#### Objectives
- Test complete disaster recovery
- Validate all DR procedures
- Verify team coordination
- Test communication procedures

#### Scenario
- Simulate complete regional failure
- Test all DR procedures
- Validate team coordination
- Test communication procedures

#### Steps
1. **Preparation**:
   - Notify all stakeholders
   - Prepare all procedures
   - Set up communication channels
   - Brief all team members

2. **Execution**:
   - Simulate complete failure
   - Execute all DR procedures
   - Test team coordination
   - Validate communication

3. **Validation**:
   - Verify all services restored
   - Check all procedures executed
   - Validate team coordination
   - Test communication effectiveness

4. **Documentation**:
   - Record all lessons learned
   - Update all procedures
   - Identify all improvements
   - Schedule follow-up actions

#### Success Criteria
- ✅ Complete recovery < 15 minutes
- ✅ All procedures executed
- ✅ Team coordination effective
- ✅ Communication clear and timely

---

## Monitoring and Alerting

### DR-Specific Alerts
- **Region Outage**: No successful webhooks in region for 5m
- **Performance Skew**: EU p95 > 2× US p95 for 15m
- **DLQ Spike**: >10 messages in 5m
- **Schema Incompatibility**: >0.1% drops in 10m
- **Failover Events**: Automatic failover triggered
- **Rollback Events**: Configuration rollback executed

### Escalation Matrix
1. **On-Call Engineer**: First responder (15m)
2. **Team Lead**: Escalation (30m)
3. **Engineering Manager**: Management (1h)
4. **CTO**: Executive (2h)

### Communication Channels
- **Slack**: #siraj-alerts, #siraj-dr
- **Email**: alerts@siraj.life, dr@siraj.life
- **Phone**: [Emergency number]
- **Status Page**: status.siraj.life

---

## Post-Incident Procedures

### Incident Documentation
1. **Timeline**: Record all events and actions
2. **Root Cause**: Identify underlying cause
3. **Impact Assessment**: Document business impact
4. **Resolution**: Record resolution steps
5. **Lessons Learned**: Document improvements

### Follow-up Actions
1. **Procedure Updates**: Update DR procedures
2. **Training**: Schedule additional training
3. **Monitoring**: Enhance monitoring and alerting
4. **Testing**: Schedule additional drills
5. **Documentation**: Update all documentation

---

This DR plan provides comprehensive procedures for handling disasters and ensuring business continuity. Regular testing and updates ensure readiness for any scenario.
