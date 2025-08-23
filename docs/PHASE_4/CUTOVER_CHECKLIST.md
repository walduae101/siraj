# Production Cutover Checklist

**Purpose**: Step-by-step guide for safe production deployment  
**Scope**: PHASE 4 deployment with zero-downtime cutover  
**Duration**: 4-6 hours total

---

## Pre-Cutover Preparation (Week Before)

### ✅ Environment Setup

- [ ] **TEST Environment**: Deploy and validate PHASE 4 in test environment
- [ ] **PROD Environment**: Create production Firebase project (`siraj-prod`)
- [ ] **Secret Manager**: Set up production secret bundle (`siraj-prod-secrets`)
- [ ] **PayNow Configuration**: Configure production webhook endpoints
- [ ] **Monitoring**: Set up production monitoring and alerting

### ✅ Validation Checklist

- [ ] **Reconciliation Job**: Running successfully in TEST for 7 days
- [ ] **Zero Violations**: No invariant violations in TEST environment
- [ ] **Backfill Operations**: Tested and validated in TEST
- [ ] **Performance**: Webhook response times < 250ms in TEST
- [ ] **Security**: All CI guardrails passing

### ✅ Team Preparation

- [ ] **On-Call Team**: Notify and brief on-call engineers
- [ ] **Stakeholders**: Inform business stakeholders of cutover
- [ ] **Documentation**: Update runbooks and procedures
- [ ] **Rollback Plan**: Document rollback procedures

---

## Cutover Day Timeline

### T-24 Hours: Final Validation

**Time**: 24 hours before cutover  
**Duration**: 2 hours  
**Team**: DevOps + Development

#### Tasks

- [ ] **Final Reconciliation**: Run reconciliation in TEST environment
  ```bash
  curl -X POST https://test-app.com/api/jobs/reconcile \
    -H "Authorization: Bearer $OIDC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"date": "2025-01-09"}'
  ```

- [ ] **Verify Zero Violations**: Confirm no invariant violations
  ```bash
  # Check reconciliation reports
  gcloud logging read 'resource.type="cloud_run_revision" AND 
    jsonPayload.component="recon" AND 
    jsonPayload.status="adjusted"' \
    --limit=10
  ```

- [ ] **Performance Test**: Load test webhook endpoints
  ```bash
  # Test webhook response times
  for i in {1..100}; do
    curl -X POST https://test-app.com/api/paynow/webhook \
      -H "Content-Type: application/json" \
      -d '{"test": true}' &
  done
  wait
  ```

- [ ] **Backup Verification**: Verify Firestore backup is current
  ```bash
  # Check last backup timestamp
  gcloud firestore backups list --project=siraj-test
  ```

#### Success Criteria

- [ ] Zero invariant violations in TEST
- [ ] Webhook response times < 250ms (p95)
- [ ] All monitoring dashboards green
- [ ] Backup completed within last 24 hours

---

### T-2 Hours: Pre-Cutover Freeze

**Time**: 2 hours before cutover  
**Duration**: 30 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Freeze Manual Adjustments**: Disable admin panel wallet adjustments
  ```bash
  # Set feature flag to disable admin adjustments
  ADMIN_ADJUSTMENTS_ENABLED=false
  ```

- [ ] **Notify Team**: Send cutover notification to stakeholders
  ```bash
  # Send notification
  echo "🚀 PHASE 4 Production Cutover starting in 2 hours"
  echo "Manual wallet adjustments temporarily disabled"
  ```

- [ ] **Final Monitoring Check**: Verify all systems healthy
  ```bash
  # Check system health
  curl https://test-app.com/api/health
  ```

#### Success Criteria

- [ ] Admin panel adjustments disabled
- [ ] All stakeholders notified
- [ ] System health checks passing

---

### T-1 Hour: Final Snapshot

**Time**: 1 hour before cutover  
**Duration**: 30 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Create Firestore Snapshot**: Create final backup before cutover
  ```bash
  # Create manual backup
  gcloud firestore backups create \
    --project=siraj-test \
    --collection-ids="users,products,webhookEvents"
  ```

- [ ] **Verify Snapshot**: Confirm backup completed successfully
  ```bash
  # Verify backup
  gcloud firestore backups list --project=siraj-test --limit=1
  ```

- [ ] **Final Reconciliation**: Run one last reconciliation in TEST
  ```bash
  curl -X POST https://test-app.com/api/jobs/reconcile \
    -H "Authorization: Bearer $OIDC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"date": "2025-01-10"}'
  ```

#### Success Criteria

- [ ] Firestore backup completed successfully
- [ ] Zero invariant violations in final reconciliation
- [ ] Backup timestamp recorded for rollback reference

---

### T-30 Minutes: Deployment Preparation

**Time**: 30 minutes before cutover  
**Duration**: 20 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Container Build**: Build production container image
  ```bash
  # Build and tag production image
  docker build -t gcr.io/siraj-prod/siraj:phase4-production .
  docker push gcr.io/siraj-prod/siraj:phase4-production
  ```

- [ ] **Environment Variables**: Prepare production environment config
  ```bash
  # Set production environment variables
  ENVIRONMENT=prod
  RECONCILIATION_ENABLED=true
  BACKFILL_ENABLED=true
  ```

- [ ] **Service Account**: Verify production service account permissions
  ```bash
  # Check service account permissions
  gcloud projects get-iam-policy siraj-prod \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount"
  ```

#### Success Criteria

- [ ] Production container image built and pushed
- [ ] Environment variables configured
- [ ] Service account permissions verified

---

### T-10 Minutes: Final Checks

**Time**: 10 minutes before cutover  
**Duration**: 10 minutes  
**Team**: DevOps + Development

#### Tasks

- [ ] **Team Standby**: Confirm all team members on standby
- [ ] **Communication Channels**: Verify Slack/email notifications working
- [ ] **Monitoring Dashboards**: Open all monitoring dashboards
- [ ] **Rollback Procedures**: Review rollback steps

#### Success Criteria

- [ ] All team members confirmed on standby
- [ ] Communication channels tested
- [ ] Monitoring dashboards accessible

---

### T-0: Production Deployment

**Time**: Cutover start  
**Duration**: 30 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Deploy to Production**: Deploy PHASE 4 to production
  ```bash
  # Deploy to Cloud Run
  gcloud run deploy siraj-prod \
    --image gcr.io/siraj-prod/siraj:phase4-production \
    --platform managed \
    --region us-central1 \
    --project siraj-prod \
    --set-env-vars ENVIRONMENT=prod,RECONCILIATION_ENABLED=true
  ```

- [ ] **Health Check**: Verify production deployment healthy
  ```bash
  # Check production health
  curl https://prod-app.com/api/health
  ```

- [ ] **Feature Flag Verification**: Confirm production feature flags
  ```bash
  # Verify feature flags
  curl https://prod-app.com/api/health | jq '.features'
  ```

#### Success Criteria

- [ ] Production deployment successful
- [ ] Health checks passing
- [ ] Feature flags correctly set

---

### T+5 Minutes: PayNow Webhook Switch

**Time**: 5 minutes after deployment  
**Duration**: 15 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Update PayNow Webhooks**: Switch webhook endpoints to production
  ```bash
  # Update PayNow webhook URLs (via PayNow dashboard)
  # Change from: https://test-app.com/api/paynow/webhook
  # Change to:   https://prod-app.com/api/paynow/webhook
  ```

- [ ] **Test Webhook**: Send test webhook to production
  ```bash
  # Send test webhook
  curl -X POST https://prod-app.com/api/paynow/webhook \
    -H "Content-Type: application/json" \
    -H "X-PayNow-Signature: test-signature" \
    -d '{"test": true, "eventType": "ON_ORDER_COMPLETED"}'
  ```

- [ ] **Verify Processing**: Confirm webhook processed correctly
  ```bash
  # Check webhook processing
  gcloud logging read 'resource.type="cloud_run_revision" AND 
    jsonPayload.component="webhook"' \
    --limit=5 --project=siraj-prod
  ```

#### Success Criteria

- [ ] PayNow webhooks updated to production
- [ ] Test webhook processed successfully
- [ ] No errors in webhook processing

---

### T+20 Minutes: Monitoring Phase

**Time**: 20 minutes after deployment  
**Duration**: 2 hours  
**Team**: DevOps + Development

#### Tasks

- [ ] **Performance Monitoring**: Monitor webhook response times
  ```bash
  # Monitor response times
  gcloud logging read 'resource.type="cloud_run_revision" AND 
    jsonPayload.component="webhook"' \
    --format="table(timestamp,jsonPayload.response_time)" \
    --project=siraj-prod
  ```

- [ ] **Error Monitoring**: Watch for any errors or alerts
  ```bash
  # Monitor errors
  gcloud logging read 'resource.type="cloud_run_revision" AND 
    severity>=ERROR' \
    --limit=10 --project=siraj-prod
  ```

- [ ] **Dashboard Monitoring**: Watch all monitoring dashboards
  - [ ] Webhook response times < 250ms
  - [ ] Error rates < 1%
  - [ ] No invariant violations
  - [ ] System health checks passing

#### Success Criteria

- [ ] Webhook response times < 250ms (p95)
- [ ] Error rate < 1%
- [ ] No critical alerts
- [ ] All dashboards green

---

### T+2 Hours: Unfreeze Operations

**Time**: 2 hours after deployment  
**Duration**: 30 minutes  
**Team**: DevOps

#### Tasks

- [ ] **Re-enable Admin Panel**: Re-enable manual wallet adjustments
  ```bash
  # Re-enable admin adjustments
  ADMIN_ADJUSTMENTS_ENABLED=true
  ```

- [ ] **Final Health Check**: Complete final system health verification
  ```bash
  # Final health check
  curl https://prod-app.com/api/health
  ```

- [ ] **Team Notification**: Send cutover completion notification
  ```bash
  # Send completion notification
  echo "✅ PHASE 4 Production Cutover completed successfully"
  echo "All systems operational and monitoring"
  ```

#### Success Criteria

- [ ] Admin panel adjustments re-enabled
- [ ] All health checks passing
- [ ] Team notified of successful completion

---

## Post-Cutover Verification (Next 24 Hours)

### Hour 1-6: Intensive Monitoring

- [ ] **Webhook Processing**: Monitor all incoming webhooks
- [ ] **Performance Metrics**: Track response times and throughput
- [ ] **Error Rates**: Monitor for any increase in errors
- [ ] **User Reports**: Watch for any user-reported issues

### Hour 6-12: Reconciliation Check

- [ ] **Daily Reconciliation**: Run first production reconciliation
  ```bash
  curl -X POST https://prod-app.com/api/jobs/reconcile \
    -H "Authorization: Bearer $OIDC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"date": "2025-01-10"}'
  ```

- [ ] **Verify Results**: Check reconciliation results
  ```bash
  # Check reconciliation results
  gcloud logging read 'resource.type="cloud_run_revision" AND 
    jsonPayload.component="recon"' \
    --limit=10 --project=siraj-prod
  ```

### Hour 12-24: Business Verification

- [ ] **User Testing**: Have business users test key workflows
- [ ] **Admin Panel**: Verify admin panel functionality
- [ ] **Reports**: Generate and verify business reports
- [ ] **Performance**: Confirm performance meets expectations

---

## Rollback Procedures

### Immediate Rollback (If Critical Issues)

**Trigger**: Critical system failures, data corruption, security issues

#### Steps

1. **Stop Production Traffic**:
   ```bash
   # Scale down production service
   gcloud run services update siraj-prod \
     --concurrency=0 \
     --max-instances=0 \
     --project=siraj-prod
   ```

2. **Revert PayNow Webhooks**:
   ```bash
   # Change webhooks back to test environment
   # Via PayNow dashboard
   ```

3. **Restore from Backup**:
   ```bash
   # Restore Firestore from backup
   gcloud firestore import gs://backup-bucket/backup-path \
     --project=siraj-prod
   ```

4. **Redeploy Previous Version**:
   ```bash
   # Deploy previous stable version
   gcloud run deploy siraj-prod \
     --image gcr.io/siraj-prod/siraj:previous-stable \
     --project=siraj-prod
   ```

### Feature Flag Rollback (If Non-Critical Issues)

**Trigger**: Performance issues, feature problems, monitoring alerts

#### Steps

1. **Disable PHASE 4 Features**:
   ```bash
   # Disable reconciliation and backfill
   RECONCILIATION_ENABLED=false
   BACKFILL_ENABLED=false
   ```

2. **Revert to Previous Configuration**:
   ```bash
   # Update environment variables
   ENVIRONMENT=test
   PRODUCT_SOT=gsm
   ```

3. **Monitor and Assess**: Monitor system behavior and assess issues

---

## Success Criteria

### Technical Success

- [ ] **Zero Downtime**: No service interruption during cutover
- [ ] **Performance**: Webhook response times < 250ms (p95)
- [ ] **Reliability**: Error rate < 1%
- [ ] **Data Integrity**: No data loss or corruption

### Business Success

- [ ] **User Experience**: No user-reported issues
- [ ] **Admin Operations**: Admin panel fully functional
- [ ] **Reporting**: All business reports accurate
- [ ] **Compliance**: All security and compliance requirements met

### Operational Success

- [ ] **Monitoring**: All monitoring and alerting operational
- [ ] **Documentation**: All procedures updated
- [ ] **Team Knowledge**: Team trained on new systems
- [ ] **Future Readiness**: Foundation for Phase 5 established

---

## Communication Plan

### Stakeholder Updates

- **T-24 Hours**: Cutover notification
- **T-2 Hours**: Final reminder
- **T+0**: Cutover started
- **T+30 Minutes**: Initial deployment complete
- **T+2 Hours**: Cutover complete
- **T+24 Hours**: Post-cutover summary

### Escalation Procedures

1. **Technical Issues**: DevOps team → Development team → CTO
2. **Business Issues**: Product team → Business stakeholders → CEO
3. **Security Issues**: Security team → CISO → Executive team

---

## Post-Cutover Activities

### Week 1

- [ ] **Performance Analysis**: Analyze performance metrics
- [ ] **User Feedback**: Collect and address user feedback
- [ ] **Documentation**: Update all documentation
- [ ] **Training**: Train team on new features

### Month 1

- [ ] **Stability Assessment**: Assess system stability
- [ ] **Optimization**: Identify and implement optimizations
- [ ] **Monitoring Tuning**: Adjust monitoring thresholds
- [ ] **Phase 5 Planning**: Begin planning for Phase 5

---

## Emergency Contacts

### Primary Contacts

- **DevOps Lead**: [Contact Information]
- **Development Lead**: [Contact Information]
- **Security Lead**: [Contact Information]

### Escalation Contacts

- **CTO**: [Contact Information]
- **CISO**: [Contact Information]
- **CEO**: [Contact Information]

---

**Note**: This checklist should be reviewed and updated before each major deployment. All team members should be familiar with their roles and responsibilities during the cutover process.
