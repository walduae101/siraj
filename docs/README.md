# 📚 Documentation Index

**Updated on: 2025-01-10**

---

## 🚀 Start Here

**New to the PayNow webhook system?** Begin with:
1. [Phase 1 Runbook](./PHASE_1/RUNBOOK.md) - Complete setup and activation guide
2. [Wallet Contract](./SECURITY/WALLET_CONTRACT.md) - Security boundaries and canonical paths

---

## 📋 Documentation by Category

### 🔧 **Phase 1: Monitoring & Security**
- [**Runbook**](./PHASE_1/RUNBOOK.md) - Complete Phase 1 activation guide
- [**Monitoring Setup**](./PHASE_1/MONITORING_SETUP.md) - Metrics, dashboard, and alerts
- [**Test Scenarios**](./PHASE_1/TEST_SCENARIOS.md) - Validation test cases  
- [**Final Status Template**](./PHASE_1/FINAL_STATUS_TEMPLATE.md) - Completion checklist

### 🚀 **Phase 2: Queue Architecture**
- [**Implementation Guide**](./PHASE_2/IMPLEMENTATION_GUIDE.md) - Complete queue setup
- [**Message Contract**](./PHASE_2/QUEUE_MESSAGE_CONTRACT.md) - Pub/Sub message format

### 🛡️ **Phase 3: Product SoT + Ledger & Reversals + Admin**
- [**Implementation Guide**](./PHASE_3/README.md) - Complete Phase 3 documentation
- [**Completion Report**](./PHASE_3_COMPLETION_REPORT.md) - Final status and test results

### 🔒 **Phase 4: Revenue Assurance & Production Cutover**
- [**Implementation Guide**](./PHASE_4/README.md) - Complete Phase 4 documentation
- [**Reconciliation Design**](./PHASE_4/RECONCILIATION_DESIGN.md) - Automated reconciliation system
- [**Backfill Runbook**](./PHASE_4/BACKFILL_RUNBOOK.md) - Webhook replay and reversal operations
- [**CI Guardrails**](./PHASE_4/CIS_GUARDRAILS.md) - Secret scanning and security controls
- [**Cutover Checklist**](./PHASE_4/CUTOVER_CHECKLIST.md) - Production deployment guide

### 🛡️ **Security**
- [**Wallet Contract**](./SECURITY/WALLET_CONTRACT.md) - Canonical paths and restrictions
- [**TTL Configuration**](./SECURITY/WEBHOOK_TTL_CONFIGURATION.md) - Firestore cleanup setup

### 📖 **Operations**
- [**Webhook Runbook**](./RUNBOOKS/WEBHOOK_RUNBOOK.md) - Incident response procedures
- [**Alert Policies**](./REFERENCE/ALERT_POLICIES.md) - Complete alert reference
- [**Log Fields**](./REFERENCE/LOG_FIELDS.md) - Structured logging dictionary

---

## 🎯 **Quick Access**

| Task | Documentation |
|------|---------------|
| Set up monitoring | [Phase 1 Runbook](./PHASE_1/RUNBOOK.md) |
| Configure alerts | [Monitoring Setup](./PHASE_1/MONITORING_SETUP.md) |
| Test webhooks | [Test Scenarios](./PHASE_1/TEST_SCENARIOS.md) |
| Enable queue mode | [Phase 2 Guide](./PHASE_2/IMPLEMENTATION_GUIDE.md) |
| Admin operations | [Phase 3 Guide](./PHASE_3/README.md) |
| Run reconciliation | [Phase 4 Guide](./PHASE_4/README.md) |
| Execute backfill | [Backfill Runbook](./PHASE_4/BACKFILL_RUNBOOK.md) |
| Production cutover | [Cutover Checklist](./PHASE_4/CUTOVER_CHECKLIST.md) |
| Respond to alerts | [Webhook Runbook](./RUNBOOKS/WEBHOOK_RUNBOOK.md) |
| Security review | [Wallet Contract](./SECURITY/WALLET_CONTRACT.md) |

---

## ⚠️ **Important Notes**

- **Environment**: All documentation reflects **TEST environment** setup
- **Production**: Values must be updated by operations team with approval
- **TTL**: All references use **30-day** retention (not 90 days)
- **Signatures**: PayNow uses **base64** HMAC with **lowercase** headers

---

## 📊 **Architecture Overview**

### Current (Phase 1)
```
PayNow → Webhook → Process → Credit Points → Firestore
                ↓
         Structured Logs → Metrics → Dashboard + Alerts
```

### Future (Phase 2)
```
PayNow → Webhook (Fast ACK) → Pub/Sub → Worker → Firestore
                                  ↓
                             Dead Letter Queue
```

---

## 🔗 **External Links**

- [Cloud Console - Monitoring](https://console.cloud.google.com/monitoring?project=walduae-project-20250809071906)
- [Cloud Console - Firestore](https://console.cloud.google.com/firestore?project=walduae-project-20250809071906)
- [Cloud Console - Cloud Run](https://console.cloud.google.com/run?project=walduae-project-20250809071906)
- [GitHub Repository](https://github.com/walduae101/siraj)

---

**Last Updated**: January 10, 2025  
**Maintainer**: Development Team
