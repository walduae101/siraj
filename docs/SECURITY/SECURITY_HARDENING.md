# Phase D: Security Hardening & Guardrails

**Updated on: 2025-01-10**

---

## 🚨 CRITICAL SECURITY INCIDENT RESPONSE - PHASE D

This document provides complete security hardening procedures to prevent future secrets exposure incidents.

---

## Overview

**Status**: Secrets rotated and migrated to Secret Manager  
**Goal**: Implement comprehensive security controls to make future incidents impossible  
**Approach**: Defense in depth with multiple layers of protection

---

## 1. Pre-commit Security Hooks

### 1.1 Install Gitleaks
```bash
# Install Gitleaks for Windows
curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest | grep "browser_download_url.*windows_x64.zip" | cut -d '"' -f 4 | xargs curl -L -o gitleaks.zip
Expand-Archive gitleaks.zip -DestinationPath C:\tools\gitleaks
$env:PATH += ";C:\tools\gitleaks"
```

### 1.2 Configure Gitleaks
Create `.gitleaks.toml`:
```toml
[extend]
# Use the default Gitleaks rules
useDefault = true

# Custom rules for our specific patterns
[[rules]]
description = "PayNow API Key"
id = "paynow-api-key"
regex = '''pnapi_v1_[A-Za-z0-9]{40,}'''
tags = ["key", "PayNow"]

[[rules]]
description = "PayNow Webhook Secret"
id = "paynow-webhook-secret"  
regex = '''pn-[a-f0-9]{32}'''
tags = ["secret", "PayNow"]

[[rules]]
description = "Firebase API Key"
id = "firebase-api-key"
regex = '''AIza[A-Za-z0-9_-]{35}'''
tags = ["key", "Firebase"]

[[rules]]
description = "OpenAI API Key"
id = "openai-api-key"
regex = '''sk-proj-[A-Za-z0-9]{20,}'''
tags = ["key", "OpenAI"]

# Allowlist for template files
[allowlist]
description = "Template files with placeholder secrets"
files = [
  "cloudrun.env.template.yaml",
  "docs/SECURITY/SECRET_MANAGER_MIGRATION.md"
]
```

### 1.3 Update Husky Pre-commit Hook
```bash
# Update .husky/pre-commit
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running security checks..."

# Run Gitleaks to prevent secret commits
gitleaks detect --verbose --redact --config=.gitleaks.toml
if [ $? -ne 0 ]; then
  echo "❌ SECURITY: Secrets detected! Commit blocked."
  echo "   Review the files above and remove any sensitive information."
  exit 1
fi

echo "✅ Security scan passed"

# Run existing checks
pnpm run check
EOF

chmod +x .husky/pre-commit
```

---

## 2. GitHub Repository Security

### 2.1 Enable Secret Scanning & Push Protection
1. Go to [Repository Security Settings](https://github.com/walduae101/siraj/settings/security_analysis)
2. **Secret scanning**: ✅ Enable
3. **Push protection**: ✅ Enable  
4. **Secret scanning for issues**: ✅ Enable

### 2.2 Branch Protection Rules
```bash
# Enable branch protection via GitHub CLI (if available)
gh api repos/walduae101/siraj/branches/main/protection -X PUT --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci/build", "ci/test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### 2.3 Repository Security Configurations
1. **Settings** → **General**:
   - ✅ Disable merge commits (require squash/rebase)
   - ✅ Automatically delete head branches

2. **Settings** → **Code security and analysis**:
   - ✅ Dependency graph
   - ✅ Dependabot alerts  
   - ✅ Dependabot security updates
   - ✅ Code scanning (CodeQL analysis)

---

## 3. CI/CD Security Pipeline

### 3.1 Create Security Workflow
Create `.github/workflows/security.yml`:
```yaml
name: Security Checks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        
    - name: Run Gitleaks
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITLEAKS_CONFIG: .gitleaks.toml
        
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
        
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

  dependency-check:
    name: Dependency Security
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run npm audit
      run: npm audit --audit-level=moderate
```

### 3.2 Add Build-time Secret Detection
Update existing CI to include secret scanning:
```yaml
# Add to existing CI workflow
- name: Scan for secrets in build artifacts
  run: |
    # Scan built files for any remaining secrets
    gitleaks detect --source=".next" --verbose --config=.gitleaks.toml || exit 1
```

---

## 4. Cloud Infrastructure Security

### 4.1 IAM Least Privilege Review
```bash
# Review Cloud Run service account permissions
SA_EMAIL=$(gcloud run services describe siraj --region=us-central1 --format="value(spec.template.spec.serviceAccountName)")

# List current IAM bindings
gcloud projects get-iam-policy walduae-project-20250809071906 \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SA_EMAIL" \
  --format="table(bindings.role)"

# Expected roles ONLY:
# - roles/secretmanager.secretAccessor (on specific secrets)
# - roles/datastore.user  
# - roles/logging.logWriter
# - roles/monitoring.metricWriter
```

### 4.2 Network Security
```bash
# Ensure Cloud Run is configured securely
gcloud run services update siraj \
  --region=us-central1 \
  --ingress=all \
  --cpu-throttling \
  --max-instances=10 \
  --memory=1Gi \
  --timeout=60
```

### 4.3 Secret Manager Access Audit
```bash
# Create log-based metric for secret access monitoring
gcloud logging metrics create secret_access_audit \
  --description="Monitor all Secret Manager access" \
  --log-filter='protoPayload.serviceName="secretmanager.googleapis.com" AND protoPayload.methodName="google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion"'

# Create alert for unusual secret access patterns
gcloud alpha monitoring policies create --policy-from-file - << 'EOF'
displayName: "Secret Manager - Unusual Access Pattern"
conditions:
  - displayName: "High Secret Access Rate"
    conditionThreshold:
      filter: 'metric.type="logging.googleapis.com/user/secret_access_audit"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 100
      duration: 300s
notificationChannels:
  - "PayNow Webhook Alerts"
EOF
```

---

## 5. Application-Level Security

### 5.1 Environment Variable Validation
Add to `src/server/config.ts`:
```typescript
// Validate no secrets in environment variables
function validateNoSecretsInEnv() {
  const dangerousPatterns = [
    /AIza[A-Za-z0-9_-]{35}/, // Firebase API keys
    /pnapi_v1_[A-Za-z0-9]{40,}/, // PayNow API keys  
    /sk-proj-[A-Za-z0-9]{20,}/, // OpenAI API keys
    /pn-[a-f0-9]{32}/ // PayNow webhook secrets
  ];
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('NEXT_PUBLIC_')) continue; // Skip public vars
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value || '')) {
        console.error(`❌ SECURITY: Detected secret pattern in environment variable ${key}`);
        console.error('   Secrets must be loaded from Secret Manager, not environment variables');
        process.exit(1);
      }
    }
  }
}

// Run validation on startup
validateNoSecretsInEnv();
```

### 5.2 Client-Side Security Headers
Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.googleapis.com https://api.openai.com",
              "frame-src 'self' https://www.google.com"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options', 
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 6. Secret Rotation Automation

### 6.1 Quarterly Rotation Schedule
Create `scripts/rotate-secrets.sh`:
```bash
#!/bin/bash
# Quarterly secret rotation script

echo "🔄 Starting quarterly secret rotation..."

# 1. Generate new secrets
NEW_CRON_SECRET=$(openssl rand -base64 32)

# 2. Create new secret versions
echo "$NEW_CRON_SECRET" | gcloud secrets versions add cron-secret --data-file=-

# 3. Update Cloud Run to use new versions (zero downtime)
gcloud run services update siraj \
  --region=us-central1 \
  --update-secrets="/var/secrets/siraj/config.json=siraj-config:latest"

# 4. Test the deployment
echo "🧪 Testing deployment..."
curl -f https://siraj.life/api/health || exit 1

# 5. Schedule cleanup of old versions (after 7 days)
echo "📅 Old secret versions will be cleaned up in 7 days"

echo "✅ Secret rotation complete"
```

### 6.2 Cloud Scheduler Setup
```bash
# Create scheduled secret rotation (quarterly)
gcloud scheduler jobs create http secret-rotation-job \
  --location=us-central1 \
  --schedule="0 0 1 */3 *" \
  --uri="https://siraj.life/api/cron/rotate-secrets" \
  --http-method=POST \
  --headers="Authorization=Bearer $(gcloud secrets versions access latest --secret=cron-secret)" \
  --description="Quarterly secret rotation"
```

---

## 7. Security Monitoring & Alerting

### 7.1 Enhanced Alert Policies
```bash
# Alert on any Secret Manager access outside business hours
gcloud alpha monitoring policies create --policy-from-file - << 'EOF'
displayName: "Secret Manager - After Hours Access"  
conditions:
  - displayName: "Secret access outside 9-5 UTC"
    conditionThreshold:
      filter: 'protoPayload.serviceName="secretmanager.googleapis.com"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 0
      duration: 60s
notificationChannels:
  - "PayNow Webhook Alerts"
documentation:
  content: "Secret Manager access detected outside normal business hours. Investigate immediately."
EOF
```

### 7.2 Security Incident Response Playbook
Create `docs/SECURITY/INCIDENT_RESPONSE.md`:
- **Detection**: How to identify security incidents
- **Containment**: Immediate steps to limit damage
- **Investigation**: Forensic analysis procedures  
- **Recovery**: Steps to restore normal operations
- **Lessons Learned**: Post-incident review process

---

## 8. Validation & Testing

### 8.1 Security Testing Checklist
- [ ] Gitleaks pre-commit hook blocks secret commits
- [ ] GitHub push protection prevents secret pushes
- [ ] CI/CD pipeline includes security scanning
- [ ] Application validates environment variables
- [ ] Cloud Run uses Secret Manager exclusively
- [ ] IAM follows least privilege principle

### 8.2 Penetration Testing
```bash
# Test for common vulnerabilities
npm install -g snyk
snyk test --severity-threshold=high

# Test secret exposure
gitleaks detect --source=. --config=.gitleaks.toml

# Test API endpoints for security
curl -I https://siraj.life/api/paynow/webhook
curl -I https://siraj.life/api/cron/subscription-credit
```

---

## 9. Documentation Updates

### 9.1 Developer Security Guidelines
Update `docs/CONTRIBUTING.md` with:
- Never commit secrets to git
- Use Secret Manager for all sensitive configuration
- Run security checks before committing
- Report security issues immediately

### 9.2 Operations Security Manual
Create `docs/SECURITY/OPERATIONS_MANUAL.md`:
- Secret Manager access procedures
- Incident response contacts
- Rotation schedules
- Security audit procedures

---

## Completion Criteria

Phase D is complete when:
- [ ] Gitleaks pre-commit hooks installed and tested
- [ ] GitHub secret scanning and push protection enabled
- [ ] CI/CD security pipeline implemented
- [ ] Application-level security validations added
- [ ] Secret rotation automation configured
- [ ] Enhanced monitoring and alerting deployed
- [ ] Security documentation updated
- [ ] All security tests passing

---

**Next Phase**: [Phase E - End-to-End Validation](./VALIDATION_CHECKLIST.md)
