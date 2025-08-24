# Phase 7: Multi-Region Readiness - Runbook

**Updated on: 2025-01-10**

---

## Overview

This runbook provides operational procedures for Phase 7 multi-region webhook system, including deployment, monitoring, incident response, and disaster recovery.

---

## Quick Reference

### Service URLs
- **Webhook LB**: `https://hooks.siraj.life/api/paynow/webhook`
- **Worker LB**: `https://worker.siraj.life/api/tasks/paynow/process`
- **US Webhook**: `https://siraj-webhook-us-{project}.run.app`
- **EU Webhook**: `https://siraj-webhook-eu-{project}.run.app`
- **US Worker**: `https://siraj-worker-us-{project}.run.app`
- **EU Worker**: `https://siraj-worker-eu-{project}.run.app`

### Feature Flags
- `multiRegion.enabled`: Master switch for multi-region
- `multiRegion.primaryRegion`: Primary region (us-central1)
- `multiRegion.secondaryRegion`: Secondary region (europe-west1)
- `eventSchema.version`: Current schema version (3)
- `eventSchema.minCompatible`: Minimum compatible version (2)

### Emergency Contacts
- **On-Call**: [Team contact]
- **Escalation**: [Manager contact]
- **PayNow Support**: [PayNow contact]

---

## Deployment Procedures

### Initial Multi-Region Deployment

#### Prerequisites
1. ✅ Phase 6A/6B validation complete
2. ✅ Secret Manager replication enabled
3. ✅ Service accounts created for EU region
4. ✅ DNS domains registered (hooks.siraj.life, worker.siraj.life)

#### Step 1: Deploy EU Services
```bash
# Deploy EU webhook service
gcloud run deploy siraj-webhook-eu \
  --image gcr.io/walduae-project-20250809071906/siraj:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="REGION=europe-west1,SERVICE_NAME=siraj-webhook-eu" \
  --service-account=webhook-eu-sa@walduae-project-20250809071906.iam.gserviceaccount.com

# Deploy EU worker service
gcloud run deploy siraj-worker-eu \
  --image gcr.io/walduae-project-20250809071906/siraj:latest \
  --region europe-west1 \
  --platform managed \
  --no-allow-unauthenticated \
  --set-env-vars="REGION=europe-west1,SERVICE_NAME=siraj-worker-eu" \
  --service-account=worker-eu-sa@walduae-project-20250809071906.iam.gserviceaccount.com
```

#### Step 2: Create Global Load Balancers
```bash
# Create webhook load balancer
gcloud compute url-maps create siraj-webhook-lb \
  --default-service siraj-webhook-us-backend

# Add EU backend to webhook LB
gcloud compute backend-services add-backend siraj-webhook-us-backend \
  --instance-group=eu-backend \
  --instance-group-region=europe-west1

# Create worker load balancer
gcloud compute url-maps create siraj-worker-lb \
  --default-service siraj-worker-us-backend

# Add EU backend to worker LB
gcloud compute backend-services add-backend siraj-worker-us-backend \
  --instance-group=eu-worker-backend \
  --instance-group-region=europe-west1
```

#### Step 3: Update DNS and PayNow
```bash
# Update DNS records
gcloud dns record-sets update A hooks.siraj.life \
  --rrdatas=LOAD_BALANCER_IP \
  --zone=siraj-life

gcloud dns record-sets update A worker.siraj.life \
  --rrdatas=WORKER_LB_IP \
  --zone=siraj-life

# Update PayNow webhook URL to: https://hooks.siraj.life/api/paynow/webhook
```

#### Step 4: Update Pub/Sub Subscription
```bash
# Update subscription to use worker LB
gcloud pubsub subscriptions update paynow-events-sub \
  --push-endpoint=https://worker.siraj.life/api/tasks/paynow/process \
  --push-auth-service-account=worker-lb-sa@walduae-project-20250809071906.iam.gserviceaccount.com
```

#### Step 5: Enable Multi-Region Features
```bash
# Update Secret Manager config
gcloud secrets versions add siraj-config \
  --data-file=config-with-multiregion.json

# Verify feature flags
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://secretmanager.googleapis.com/v1/projects/walduae-project-20250809071906/secrets/siraj-config/versions/latest:access
```

### Validation Checklist
- [ ] EU services responding to health checks
- [ ] Load balancers routing traffic correctly
- [ ] PayNow webhook URL updated and tested
- [ ] Pub/Sub subscription delivering to worker LB
- [ ] Multi-region feature flags enabled
- [ ] Monitoring dashboards showing both regions
- [ ] Schema version 3 events being processed

---

## Monitoring & Alerting

### Key Metrics to Monitor

#### Performance Metrics
- **Webhook ACK p95**: < 50ms per region
- **Worker Processing p95**: < 250ms per region
- **Queue Lag**: < 100 messages in DLQ
- **Schema Compatibility**: > 99.9% acceptance rate

#### Availability Metrics
- **Service Health**: All services responding
- **Load Balancer Health**: Both backends healthy
- **Region Failover**: Automatic failover working
- **Error Rates**: < 0.1% per region

### Dashboard Access
- **Multi-Region Dashboard**: [Cloud Console Link]
- **Log Queries**: [Logging Console Link]
- **Alert Policies**: [Monitoring Console Link]

### Alert Response

#### Region Outage Alert
**Trigger**: No successful webhooks in region for 5m

**Immediate Actions**:
1. Check Cloud Console for service status
2. Verify load balancer health checks
3. Check logs for error patterns
4. Initiate manual failover if needed

**Escalation**: If unresolved in 10m, escalate to on-call

#### Performance Skew Alert
**Trigger**: EU p95 > 2× US p95 for 15m

**Immediate Actions**:
1. Check EU region performance metrics
2. Review recent deployments or changes
3. Check for resource constraints
4. Consider traffic shifting to US

**Escalation**: If skew persists > 30m, escalate to team lead

#### DLQ Spike Alert
**Trigger**: >10 messages in 5m

**Immediate Actions**:
1. Check DLQ message contents
2. Identify error patterns
3. Review recent code changes
4. Execute DLQ triage procedure

**Escalation**: If >50 messages, escalate immediately

---

## Incident Response

### Service Outage Procedures

#### Webhook Service Outage
**Symptoms**: 5xx errors from webhook endpoints

**Immediate Response**:
1. Check service logs for error patterns
2. Verify service account permissions
3. Check Secret Manager access
4. Restart service if needed

**Failover Procedure**:
1. Disable unhealthy backend in load balancer
2. Verify traffic routing to healthy region
3. Monitor webhook success rates
4. Investigate root cause

**Recovery**:
1. Fix underlying issue
2. Re-enable backend in load balancer
3. Verify traffic distribution
4. Update incident report

#### Worker Service Outage
**Symptoms**: Messages not being processed, DLQ growth

**Immediate Response**:
1. Check worker service logs
2. Verify Pub/Sub subscription health
3. Check service account permissions
4. Restart worker service if needed

**Failover Procedure**:
1. Verify worker LB routing to healthy region
2. Monitor message processing rates
3. Check DLQ for backlog
4. Consider manual replay if needed

**Recovery**:
1. Fix underlying issue
2. Verify message processing resumes
3. Monitor DLQ clearance
4. Update incident report

#### Load Balancer Outage
**Symptoms**: 5xx errors from LB endpoints

**Immediate Response**:
1. Check LB health status
2. Verify backend service health
3. Check SSL certificate validity
4. Review recent LB configuration changes

**Failover Procedure**:
1. Update DNS to point to backup LB
2. Verify traffic routing
3. Monitor service availability
4. Investigate root cause

**Recovery**:
1. Fix LB configuration
2. Update DNS back to primary LB
3. Verify traffic routing
4. Update incident report

### Schema Compatibility Issues

#### Incompatible Schema Alert
**Symptoms**: High rate of `drop_incompatible` verdicts

**Immediate Response**:
1. Check schema version configuration
2. Review recent schema changes
3. Analyze dropped message patterns
4. Verify `minCompatible` setting

**Resolution**:
1. Adjust `minCompatible` version if needed
2. Update schema version if required
3. Monitor compatibility rates
4. Document schema migration

### Data Consistency Issues

#### Reconciliation Failures
**Symptoms**: Auditor job reporting non-zero deltas

**Immediate Response**:
1. Check reconciliation report details
2. Identify specific drift patterns
3. Review recent processing logs
4. Check for duplicate or missing events

**Resolution**:
1. Execute backfill procedures if needed
2. Fix underlying processing issues
3. Re-run reconciliation
4. Document root cause

---

## Disaster Recovery

### Regional Failover Procedures

#### Automatic Failover
**Trigger**: Health check failures for >30 seconds

**Process**:
1. Load balancer automatically routes to healthy region
2. Monitor traffic distribution
3. Verify service availability
4. Investigate failed region

#### Manual Failover
**Trigger**: Manual intervention required

**Process**:
1. Disable unhealthy backend in load balancer
2. Verify traffic routing to healthy region
3. Monitor service metrics
4. Document failover decision

### Complete Region Failure

#### Scenario: us-central1 Complete Outage
**Immediate Actions**:
1. Verify EU services are healthy
2. Confirm traffic routing to EU
3. Monitor EU performance under load
4. Check PayNow webhook delivery

**Recovery Steps**:
1. Wait for US region recovery
2. Verify US services are healthy
3. Re-enable US backends in load balancer
4. Monitor traffic distribution
5. Verify performance metrics

#### Scenario: europe-west1 Complete Outage
**Immediate Actions**:
1. Verify US services are healthy
2. Confirm traffic routing to US
3. Monitor US performance under load
4. Check PayNow webhook delivery

**Recovery Steps**:
1. Wait for EU region recovery
2. Verify EU services are healthy
3. Re-enable EU backends in load balancer
4. Monitor traffic distribution
5. Verify performance metrics

### Database Issues

#### Firestore Global Issues
**Symptoms**: Database errors across all regions

**Immediate Response**:
1. Check Firestore status page
2. Verify service account permissions
3. Check quota and rate limits
4. Review recent database changes

**Recovery**:
1. Wait for Firestore recovery
2. Verify database connectivity
3. Check data consistency
4. Resume normal operations

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Review performance metrics by region
- [ ] Check service account permissions
- [ ] Verify Secret Manager replication
- [ ] Review alert policy effectiveness
- [ ] Update runbook with lessons learned

#### Monthly Tasks
- [ ] Execute DLQ replay procedures
- [ ] Review and update service accounts
- [ ] Rotate API keys and secrets
- [ ] Update SSL certificates
- [ ] Review capacity planning

#### Quarterly Tasks
- [ ] Execute region failover GameDay
- [ ] Review disaster recovery procedures
- [ ] Update monitoring and alerting
- [ ] Review security configurations
- [ ] Plan capacity upgrades

### Configuration Updates

#### Feature Flag Updates
```bash
# Update multi-region configuration
gcloud secrets versions add siraj-config \
  --data-file=updated-config.json

# Verify configuration
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://secretmanager.googleapis.com/v1/projects/walduae-project-20250809071906/secrets/siraj-config/versions/latest:access
```

#### Service Account Rotation
```bash
# Create new service account
gcloud iam service-accounts create webhook-eu-sa-v2 \
  --display-name="Webhook EU Service Account v2"

# Grant permissions
gcloud projects add-iam-policy-binding walduae-project-20250809071906 \
  --member="serviceAccount:webhook-eu-sa-v2@walduae-project-20250809071906.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update service to use new SA
gcloud run services update siraj-webhook-eu \
  --service-account=webhook-eu-sa-v2@walduae-project-20250809071906.iam.gserviceaccount.com
```

---

## Troubleshooting

### Common Issues

#### High Latency in EU Region
**Symptoms**: EU p95 > 2× US p95

**Investigation**:
1. Check EU region resource utilization
2. Review network latency to Firestore
3. Check for cold starts
4. Review recent deployments

**Resolution**:
1. Scale up EU service resources
2. Optimize database queries
3. Implement connection pooling
4. Consider regional database

#### Schema Compatibility Errors
**Symptoms**: High rate of dropped events

**Investigation**:
1. Check current schema version
2. Review `minCompatible` setting
3. Analyze dropped message patterns
4. Check for version mismatches

**Resolution**:
1. Adjust schema version settings
2. Update message format if needed
3. Monitor compatibility rates
4. Document schema changes

#### Load Balancer Issues
**Symptoms**: 5xx errors from LB endpoints

**Investigation**:
1. Check backend service health
2. Verify SSL certificate validity
3. Review LB configuration
4. Check for rate limiting

**Resolution**:
1. Fix backend service issues
2. Update SSL certificates
3. Adjust LB configuration
4. Review rate limiting settings

### Debug Commands

#### Check Service Health
```bash
# Check US webhook health
curl -I https://siraj-webhook-us-{project}.run.app/health

# Check EU webhook health
curl -I https://siraj-webhook-eu-{project}.run.app/health

# Check worker health
curl -I https://siraj-worker-us-{project}.run.app/health
```

#### Check Load Balancer
```bash
# Check webhook LB health
curl -I https://hooks.siraj.life/api/paynow/webhook

# Check worker LB health
curl -I https://worker.siraj.life/api/tasks/paynow/process
```

#### Check Pub/Sub
```bash
# Check subscription status
gcloud pubsub subscriptions describe paynow-events-sub

# Check DLQ depth
gcloud pubsub subscriptions describe paynow-events-dlq
```

#### Check Logs
```bash
# Check webhook logs by region
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=siraj-webhook-us" --limit=10

# Check worker logs by region
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=siraj-worker-us" --limit=10
```

---

## Emergency Procedures

### Emergency Rollback

#### Immediate Rollback (Feature Flag)
```bash
# Disable multi-region
gcloud secrets versions add siraj-config \
  --data-file=config-single-region.json

# Verify rollback
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://secretmanager.googleapis.com/v1/projects/walduae-project-20250809071906/secrets/siraj-config/versions/latest:access
```

#### Complete Rollback (DNS + Subscription)
```bash
# Update DNS to single region
gcloud dns record-sets update A hooks.siraj.life \
  --rrdatas=SINGLE_REGION_IP \
  --zone=siraj-life

# Update subscription to direct endpoint
gcloud pubsub subscriptions update paynow-events-sub \
  --push-endpoint=https://siraj-worker-us-{project}.run.app/api/tasks/paynow/process
```

### Emergency Contacts

#### Escalation Matrix
1. **On-Call Engineer**: First responder (15m)
2. **Team Lead**: Escalation (30m)
3. **Engineering Manager**: Management (1h)
4. **CTO**: Executive (2h)

#### Communication Channels
- **Slack**: #siraj-alerts
- **Email**: alerts@siraj.life
- **Phone**: [Emergency number]
- **Status Page**: status.siraj.life

---

This runbook provides comprehensive operational procedures for Phase 7 multi-region webhook system. Regular updates and testing ensure readiness for production incidents.
