# Siraj Platform - Operations Runbook

## 🎯 Overview

This runbook provides step-by-step procedures for common operational tasks, troubleshooting, and emergency response for the Siraj platform.

---

## 🛡️ Support Mode Operations

### Enable Support Mode
```bash
# Method 1: Environment Variable
export SUPPORT_MODE=1
npm run dev

# Method 2: URL Parameter
# Navigate to: https://siraj.life/dashboard?support=1
```

### Support Mode Features
- **Visual Indicator**: Orange banner with "🛠️ وضع الدعم · {userLabel} · قراءة فقط"
- **Read-Only Controls**: All destructive actions disabled
- **Data Redaction**: Sensitive strings masked with `••••`
- **Analytics Tracking**: `ux.support_mode_view` events logged

### Disable Support Mode
```bash
unset SUPPORT_MODE
# Or remove ?support=1 from URL
```

---

## 🔑 API Key Management

### Rotate API Keys
1. **Access API Management**
   ```bash
   # Navigate to: https://siraj.life/account/api
   ```

2. **Rotate Key**
   - Click "Rotate Key" button
   - Copy new key (displayed only once)
   - Update client applications
   - Old key automatically revoked

3. **Verify Rotation**
   ```bash
   # Test with new key
   curl -H "x-api-key: siraj_live_NEW_KEY" https://siraj.life/api/ping
   ```

### Revoke API Keys
1. **Emergency Revocation**
   ```bash
   # Access Firestore console
   # Navigate to: /users/{uid}/devkeys/{keyId}
   # Set status: 'revoked'
   ```

2. **Bulk Revocation**
   ```bash
   # Use admin script (requires admin access)
   npx tsx scripts/revoke-all-keys.ts
   ```

---

## 👑 Admin Access Management

### Set Admin Custom Claims
```bash
# Method 1: Firebase Admin SDK Script
npx tsx scripts/set-admin-claims.ts

# Method 2: Firebase Console
# Navigate to: Authentication > Users > {user} > Custom Claims
# Add: { "role": "admin", "permissions": ["read", "write", "admin"] }
```

### Add Admin to Allowlist
```bash
# Method 1: Hardcoded List (Emergency)
# Edit: src/server/auth/admin.ts
# Add UID to HARDCODED_ADMINS array

# Method 2: Firestore Collection
# Navigate to: /admins/{uid}
# Add document: { "active": true, "role": "admin", "permissions": ["read", "write", "admin"] }
```

### Remove Admin Access
```bash
# Method 1: Remove Custom Claims
# Firebase Console > Authentication > Users > {user} > Custom Claims
# Remove: role and permissions fields

# Method 2: Deactivate in Firestore
# Navigate to: /admins/{uid}
# Set: { "active": false }
```

---

## 🔍 Smoke Test Operations

### Run Smoke Tests Locally
```bash
# Test against local development
BASE_URL=http://localhost:3000 npx tsx scripts/smoke-prod.ts

# Test against staging
BASE_URL=https://staging.siraj.life npx tsx scripts/smoke-prod.ts

# Test against production
BASE_URL=https://siraj.life npx tsx scripts/smoke-prod.ts
```

### Interpret Smoke Test Results
```bash
# Exit Codes:
# 0 = All tests passed
# 1 = HTTP failures (status != 200)
# 2 = SLO violations (latency exceeded)

# Example Output:
✅ /api/health - 200 (450ms)
⚠️  /dashboard - 200 (2800ms) - SLO VIOLATION (>2500ms)
❌ /account/api - 500 (1200ms)
```

### View Smoke Test Logs
```bash
# GitHub Actions
# Navigate to: Actions > Production Smoke Tests
# Download artifacts: smoke-logs-{environment}-{run_number}.log

# Local Logs
tail -f smoke-results.log
```

---

## 🚨 Emergency Response

### Application Down
1. **Immediate Response**
   ```bash
   # Check smoke tests
   npx tsx scripts/smoke-prod.ts
   
   # Check Firebase status
   firebase projects:list
   
   # Check deployment status
   firebase hosting:channel:list
   ```

2. **Rollback Procedure**
   ```bash
   # List available versions
   firebase hosting:channel:list
   
   # Rollback to previous version
   firebase hosting:channel:deploy previous-version --expires 1d
   
   # Verify rollback
   npx tsx scripts/smoke-prod.ts
   ```

### High Error Rate
1. **Investigate**
   ```bash
   # Check Firebase Console > Functions > Logs
   # Look for error patterns and stack traces
   
   # Check analytics for error events
   # Navigate to: /admin/analytics
   ```

2. **Mitigate**
   ```bash
   # Enable maintenance mode (if available)
   # Or rollback to previous version
   ```

### Security Incident
1. **Immediate Actions**
   ```bash
   # Revoke all API keys
   npx tsx scripts/revoke-all-keys.ts
   
   # Check admin access logs
   # Navigate to: /admin/analytics
   # Filter by: ux.support_mode_view events
   ```

2. **Investigation**
   ```bash
   # Check Firebase Authentication logs
   # Review admin access patterns
   # Analyze error logs for suspicious activity
   ```

---

## 🔧 Maintenance Tasks

### Deploy Firestore Indexes
```bash
# Deploy new indexes
firebase deploy --only firestore:indexes

# Check index status
firebase firestore:indexes

# Wait for indexes to build (can take up to 24 hours)
```

### Update Environment Variables
```bash
# Update Google Secret Manager
gcloud secrets create MIXPANEL_TOKEN --data-file=token.txt
gcloud secrets create GA_MEASUREMENT_ID --data-file=measurement-id.txt

# Update Firebase Functions config
firebase functions:config:set analytics.mixpanel_token="$(gcloud secrets versions access latest --secret=MIXPANEL_TOKEN)"
```

### Database Maintenance
```bash
# Backup Firestore
gcloud firestore export gs://siraj-backups/$(date +%Y%m%d)

# Clean up old data
npx tsx scripts/cleanup-old-data.ts

# Optimize queries
npx tsx scripts/analyze-queries.ts
```

---

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
- **Uptime**: Target 99.9%
- **Response Time**: P95 < 2.5s
- **Error Rate**: < 0.1%
- **Admin Access**: Track support mode usage
- **API Usage**: Monitor rate limit hits

### Alert Thresholds
- **Smoke Test Failures**: Immediate GitHub issue
- **SLO Violations**: Exit code 2, analytics event
- **High Error Rate**: > 1% triggers alert
- **Admin Access Denials**: Logged for review

### Dashboard Access
- **GitHub Actions**: Smoke test results and trends
- **Firebase Console**: Application performance and errors
- **Analytics Dashboard**: `/admin/analytics` (admin access required)

---

## 🔍 Troubleshooting Guide

### Common Issues

#### Issue: Smoke Tests Failing
```bash
# Check individual endpoints
curl -I https://siraj.life/api/health
curl -I https://siraj.life/api/ux/ping
curl -I https://siraj.life/dashboard

# Check logs
firebase functions:log --only hosting

# Common causes:
# - Firestore indexes building
# - High traffic causing timeouts
# - Deployment issues
```

#### Issue: Admin Access Denied
```bash
# Check user authentication
# Navigate to: Firebase Console > Authentication > Users

# Check custom claims
# Look for: role: "admin" or permissions: ["admin"]

# Check Firestore admin collection
# Navigate to: /admins/{uid}
# Verify: active: true
```

#### Issue: Support Mode Not Working
```bash
# Check environment variable
echo $SUPPORT_MODE

# Check URL parameter
# Ensure: ?support=1 is present

# Check browser console for errors
# Look for: SupportBanner component errors
```

#### Issue: Analytics Not Firing
```bash
# Check browser console
# Look for: [ANALYTICS] events

# Check server logs
# Look for: [ANALYTICS/SERVER] events

# Check privacy settings
# Ensure: DNT=false and consent=true
```

---

## 📞 Escalation Procedures

### Level 1: Standard Issues
- **Dashboard Problems**: Check error boundaries and retry mechanisms
- **Performance Issues**: Review smoke test results and SLO violations
- **Access Issues**: Verify admin claims and Firestore permissions

### Level 2: Critical Issues
- **Application Down**: Immediate rollback and investigation
- **Security Incidents**: Revoke access and investigate
- **Data Issues**: Contact development team

### Level 3: Emergency
- **Complete System Failure**: Emergency contacts and external support
- **Security Breach**: Immediate containment and investigation
- **Data Loss**: Emergency recovery procedures

---

## 📚 Additional Resources

- **Release Notes**: `docs/OPS/RELEASE_NOTES_SPRINT4.md`
- **API Documentation**: `/docs/api`
- **Admin Guide**: `/admin` (admin access required)
- **Support Portal**: `/support/new`
- **GitHub Repository**: [walduae101/siraj](https://github.com/walduae101/siraj)
- **Firebase Console**: [Firebase Console](https://console.firebase.google.com)
- **Google Cloud Console**: [Google Cloud Console](https://console.cloud.google.com)

---

## 🔄 Regular Maintenance Schedule

### Daily
- [ ] Check smoke test results
- [ ] Review error logs
- [ ] Monitor performance metrics

### Weekly
- [ ] Review admin access logs
- [ ] Check security alerts
- [ ] Update documentation

### Monthly
- [ ] Review and rotate secrets
- [ ] Analyze performance trends
- [ ] Update runbook procedures

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Disaster recovery testing

---

*This runbook is a living document. Update procedures as the platform evolves and new operational requirements emerge.*
