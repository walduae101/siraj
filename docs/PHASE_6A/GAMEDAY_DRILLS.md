# Phase 6A/6B GameDay Drills

**Created**: 2025-01-10  
**Status**: ✅ **READY** - Operational readiness drills

---

## Drill 1: DLQ Replay Drill

### Objective
Test DLQ replay procedures and verify error handling

### Prerequisites
- Phase 6A queue mode active
- Monitoring dashboard accessible
- Team on standby for 30 minutes

### Drill Steps

#### 1. Create Test DLQ Messages
```bash
# Send 25 test messages that will fail
for i in {1..25}; do
  curl -X POST https://siraj-207501673877.us-central1.run.app/api/paynow/webhook \
    -H "Content-Type: application/json" \
    -H "X-PayNow-Signature: invalid-signature" \
    -d '{"event_id":"drill_dlq_'"$i"'","event_type":"test.dlq.drill","data":{"test":true}}'
done
```

#### 2. Verify DLQ Population
- Check DLQ depth metric: Should show 25 messages
- Verify alert fires: DLQ depth > 10 for 5m
- Confirm triage job detects new error class

#### 3. Execute DLQ Replay
```bash
# Run DLQ triage job
npx tsx scripts/dlq-triage-job.ts

# Verify replay results
gcloud pubsub subscriptions list-messages paynow-events-sub --limit=10
```

#### 4. Validate Recovery
- DLQ depth returns to 0
- Messages processed successfully
- No duplicate credits generated
- Alert clears automatically

### Success Criteria
- [ ] 25 messages moved to DLQ
- [ ] Alert fired within 5 minutes
- [ ] Triage job classified errors correctly
- [ ] Replay completed successfully
- [ ] No duplicate processing occurred
- [ ] System returned to normal state

### Rollback Plan
If drill fails:
1. Stop triage job immediately
2. Manually clear DLQ messages
3. Reset alert thresholds
4. Document failure for post-mortem

---

## Drill 2: Worker Rollback Drill

### Objective
Test worker service rollback procedures

### Prerequisites
- Current worker deployment stable
- Previous deployment available
- Monitoring dashboard accessible

### Drill Steps

#### 1. Simulate Worker Issue
```bash
# Deploy "broken" worker version (simulated)
gcloud run deploy siraj \
  --image gcr.io/walduae-project-20250809071906/siraj:broken-worker \
  --region us-central1 \
  --no-traffic
```

#### 2. Monitor Degradation
- Watch worker p95 metric: Should increase > 350ms
- Check DLQ depth: Should start accumulating
- Verify alert fires: Worker p95 > 350ms for 10m

#### 3. Execute Rollback
```bash
# Rollback to previous deployment
gcloud run services update-traffic siraj \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1

# Verify rollback
gcloud run services describe siraj --region us-central1
```

#### 4. Validate Recovery
- Worker p95 returns to < 250ms
- DLQ depth stabilizes
- Alert clears
- Queue processing resumes normally

### Success Criteria
- [ ] Worker performance degraded as expected
- [ ] Alert fired within 10 minutes
- [ ] Rollback completed in < 5 minutes
- [ ] Performance metrics recovered
- [ ] No message loss during rollback
- [ ] System stability maintained

### Rollback Plan
If drill fails:
1. Immediately rollback to known good version
2. Check for message loss in DLQ
3. Verify all alerts are functioning
4. Document timeline for post-mortem

---

## Drill 3: Load Shedding Drill

### Objective
Test load shedding activation and effectiveness

### Prerequisites
- Load shedding service deployed
- Monitoring dashboard accessible
- Baseline metrics established

### Drill Steps

#### 1. Simulate High Load
```bash
# Send burst of messages to trigger load shedding
for i in {1..100}; do
  curl -X POST https://siraj-207501673877.us-central1.run.app/api/paynow/webhook \
    -H "Content-Type: application/json" \
    -H "X-PayNow-Signature: test-signature" \
    -d '{"event_id":"drill_load_'"$i"'","event_type":"test.load.drill","data":{"test":true}}' &
done
wait
```

#### 2. Monitor Load Shedding
- Watch queue lag metric: Should exceed 5s threshold
- Check load shedding logs: Should show activation
- Verify fraud extras disabled: Check service logs

#### 3. Validate Effectiveness
- Worker p95 should improve after load shedding
- Queue lag should stabilize
- No critical features disabled (HMAC, idempotency)

#### 4. Test Recovery
- Stop load generation
- Monitor queue lag return to normal
- Verify load shedding deactivates
- Check all features re-enabled

### Success Criteria
- [ ] Queue lag exceeded 5s threshold
- [ ] Load shedding activated automatically
- [ ] Worker performance improved
- [ ] Critical features remained active
- [ ] Load shedding deactivated on recovery
- [ ] All features re-enabled correctly

### Rollback Plan
If drill fails:
1. Stop load generation immediately
2. Manually disable load shedding if stuck
3. Verify all features are enabled
4. Check for any message loss

---

## Drill 4: Cost Alert Drill

### Objective
Test cost monitoring and alerting

### Prerequisites
- Cost monitoring active
- Budget alerts configured
- Team on standby

### Drill Steps

#### 1. Simulate Cost Spike
```bash
# Generate high-volume traffic to increase costs
for i in {1..1000}; do
  curl -X POST https://siraj-207501673877.us-central1.run.app/api/paynow/webhook \
    -H "Content-Type: application/json" \
    -H "X-PayNow-Signature: test-signature" \
    -d '{"event_id":"drill_cost_'"$i"'","event_type":"test.cost.drill","data":{"test":true}}' &
done
wait
```

#### 2. Monitor Cost Alerts
- Check Pub/Sub cost metric: Should increase
- Verify cost alert fires: > $30 in 24h
- Confirm notification received

#### 3. Execute Cost Controls
- Reduce autoscaling max instances to 5
- Monitor cost trend stabilization
- Verify alert clears when cost normalizes

#### 4. Validate Recovery
- Cost returns to baseline
- Alert clears automatically
- Autoscaling restored to normal
- No service degradation

### Success Criteria
- [ ] Cost spike generated as expected
- [ ] Alert fired within 24 hours
- [ ] Cost controls activated
- [ ] Cost trend stabilized
- [ ] Alert cleared automatically
- [ ] Service performance maintained

### Rollback Plan
If drill fails:
1. Stop cost-generating traffic
2. Reset autoscaling settings
3. Verify cost monitoring is accurate
4. Check for any service impact

---

## Drill Schedule

### Weekly Drills (30 minutes each)
- **Monday**: DLQ Replay Drill
- **Wednesday**: Load Shedding Drill
- **Friday**: Worker Rollback Drill

### Monthly Drills (60 minutes each)
- **First Monday**: Cost Alert Drill
- **Third Monday**: Full System Drill (all scenarios)

### Quarterly Drills (120 minutes each)
- **End of Quarter**: Disaster Recovery Drill
- **End of Quarter**: Multi-Region Failover Drill

---

## Post-Drill Checklist

### Documentation
- [ ] Drill results recorded
- [ ] Success criteria met
- [ ] Issues documented
- [ ] Improvements identified
- [ ] Runbook updated

### Follow-up Actions
- [ ] Address any issues found
- [ ] Update procedures if needed
- [ ] Schedule follow-up drill if failed
- [ ] Share results with team
- [ ] Update monitoring thresholds

---

## Emergency Contacts

### On-Call Engineer
- **Primary**: ops-oncall@company.com
- **Secondary**: team-lead@company.com

### Escalation Path
1. **0-5 minutes**: On-call engineer
2. **5-15 minutes**: Team lead
3. **15-30 minutes**: Engineering manager
4. **30+ minutes**: CTO

---

**Last Updated**: 2025-01-10  
**Next Review**: 2025-02-10
