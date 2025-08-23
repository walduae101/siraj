# CI Security Guardrails

**Purpose**: Prevent secrets and sensitive data from being committed to the repository  
**Scope**: Automated scanning and blocking rules for all code changes

---

## Overview

The CI security guardrails ensure that no secrets, API keys, or sensitive configuration data is accidentally committed to the repository. All secrets must be stored in Google Secret Manager and referenced via environment variables.

---

## Security Scanning Components

### 1. Gitleaks Integration

**Tool**: [Gitleaks](https://github.com/gitleaks/gitleaks)  
**Purpose**: Detect secrets and sensitive data in code and git history

**Configuration**:
```yaml
# .github/workflows/secret-scan.yml
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    args: >
      --verbose
      --redact
      --report-format=json
      --report-path=./gitleaks-report.json
```

**Features**:
- Scans full git history for secrets
- Redacts sensitive data in reports
- Exports results to GitHub Security tab
- Blocks merges on findings

### 2. Custom Pattern Detection

**Purpose**: Additional checks for project-specific secret patterns

**Patterns Detected**:
```bash
# Firebase API keys
AIza[A-Za-z0-9_-]{35}

# PayNow API keys  
pnapi_v1_[A-Za-z0-9]{40,}

# OpenAI API keys
sk-proj-[A-Za-z0-9]{20,}

# PayNow webhook secrets
pn-[a-f0-9]{32}

# Service account JSON
"type": "service_account"

# Base64 encoded secrets
[A-Za-z0-9+/]{40,}={0,2}
```

---

## Blocking Rules

### Automatic Blocking

The CI pipeline automatically blocks:

1. **Any commit with detected secrets**
2. **Pull requests with secret findings**
3. **Direct pushes to main with secrets**

### Failure Response

When secrets are detected:

```bash
echo "❌ SECURITY: Secrets detected in code!"
echo "Please remove all secrets and try again."
echo "Secrets must be stored in Google Secret Manager, not in code."
exit 1
```

### Required Actions

1. **Remove Secrets**: Delete all detected secrets from code
2. **Store in Secret Manager**: Move secrets to appropriate Secret Manager locations
3. **Update References**: Use environment variables to reference secrets
4. **Re-run Scan**: Verify no secrets remain in code

---

## Secret Management Guidelines

### ✅ Correct: Secret Manager Storage

```typescript
// ✅ Good: Secrets loaded from Secret Manager
const config = {
  paynow: {
    apiKey: process.env.PAYNOW_API_KEY, // From Secret Manager
    webhookSecret: process.env.PAYNOW_WEBHOOK_SECRET, // From Secret Manager
  },
  firebase: {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON, // From Secret Manager
  }
};
```

### ❌ Incorrect: Hardcoded Secrets

```typescript
// ❌ Bad: Secrets hardcoded in code
const config = {
  paynow: {
    apiKey: "pnapi_v1_abc123...", // SECURITY VIOLATION
    webhookSecret: "pn-abcdef1234567890...", // SECURITY VIOLATION
  },
  firebase: {
    serviceAccountJson: '{"type":"service_account",...}', // SECURITY VIOLATION
  }
};
```

### Environment-Specific Secrets

**Test Environment**:
```
Secret Manager: siraj-test-secrets
├── paynow-api-key-test
├── paynow-webhook-secret-test
├── firebase-service-account-test
└── openai-api-key-test
```

**Production Environment**:
```
Secret Manager: siraj-prod-secrets
├── paynow-api-key-prod
├── paynow-webhook-secret-prod
├── firebase-service-account-prod
└── openai-api-key-prod
```

---

## Configuration Validation

### Runtime Validation

The application validates no secrets are in environment variables:

```typescript
// src/server/config.ts
function validateNoSecretsInEnv() {
  const dangerousPatterns = [
    /AIza[A-Za-z0-9_-]{35}/, // Firebase API keys
    /pnapi_v1_[A-Za-z0-9]{40,}/, // PayNow API keys
    /sk-proj-[A-Za-z0-9]{20,}/, // OpenAI API keys
    /pn-[a-f0-9]{32}/, // PayNow webhook secrets
    /[A-Za-z0-9+/]{40,}={0,2}/, // Base64 encoded secrets
  ];

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) continue; // Skip public vars

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value || "")) {
        console.error(`❌ SECURITY: Detected secret pattern in environment variable ${key}`);
        console.error("   Secrets must be loaded from Secret Manager, not environment variables");
        process.exit(1);
      }
    }
  }
}
```

### Development Fallback

In development, the system falls back to environment variables only if Secret Manager is not available:

```typescript
// In development, fall back to environment variables
if (process.env.NODE_ENV === "development" && !fs.existsSync(CONFIG_PATH)) {
  console.warn(`[config] ${CONFIG_PATH} not found, falling back to env vars`);
  // ... development configuration
}
```

---

## Monitoring & Reporting

### GitHub Security Tab

Gitleaks findings are automatically uploaded to GitHub Security tab:

```yaml
- name: Upload Gitleaks Scan Results to GitHub Security Tab
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: gitleaks-report.json
```

### Structured Logging

Security events are logged with structured data:

```typescript
console.error("[security] Secret detected in environment", {
  component: "security",
  variable: key,
  pattern: pattern.source,
  severity: "CRITICAL"
});
```

### Alerting

Security violations trigger:

1. **CI Pipeline Failure**: Immediate blocking of merge/push
2. **GitHub Security Alert**: Notification in Security tab
3. **Team Notification**: Slack/email alerts for security team

---

## Incident Response

### Secret Exposure Response

If secrets are accidentally committed:

1. **Immediate Action**:
   - Revoke exposed secrets immediately
   - Generate new secrets
   - Update Secret Manager with new values

2. **Code Cleanup**:
   - Remove secrets from git history
   - Update all references to use Secret Manager
   - Re-run security scans

3. **Documentation**:
   - Document the incident
   - Update procedures to prevent recurrence
   - Notify affected stakeholders

### Git History Cleanup

```bash
# Remove secrets from git history (if needed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file/with/secret' \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from remote
git push origin --force --all
```

---

## Best Practices

### Development Workflow

1. **Local Development**:
   - Use `.env.local` for local secrets (never committed)
   - Reference Secret Manager in production builds
   - Test with mock secrets in unit tests

2. **Code Review**:
   - Review all environment variable usage
   - Verify secrets are not hardcoded
   - Check for accidental secret exposure

3. **Deployment**:
   - Ensure Secret Manager is configured
   - Validate no secrets in container images
   - Use environment-specific secret bundles

### Secret Rotation

1. **Regular Rotation**: Rotate secrets quarterly
2. **Automated Rotation**: Use Secret Manager automatic rotation where possible
3. **Zero-Downtime**: Coordinate rotation with deployment schedules

### Access Control

1. **Least Privilege**: Grant minimal access to secrets
2. **Audit Logging**: Monitor secret access and usage
3. **Service Accounts**: Use dedicated service accounts for secret access

---

## Troubleshooting

### Common Issues

#### False Positives

**Symptom**: Legitimate code flagged as secret

**Solution**:
```bash
# Add to .gitleaksignore
# Ignore specific patterns or files
*.test.js
# Ignore test files with mock data
```

#### Secret Manager Access

**Symptom**: Application can't access secrets

**Solution**:
1. Verify service account permissions
2. Check Secret Manager IAM roles
3. Validate secret names and versions

#### CI Pipeline Failures

**Symptom**: Security scan fails unexpectedly

**Solution**:
1. Check Gitleaks configuration
2. Verify GitHub token permissions
3. Review scan logs for specific issues

---

## Compliance

### Security Standards

The guardrails ensure compliance with:

- **OWASP Top 10**: A2 - Cryptographic Failures
- **SOC 2**: Security control requirements
- **GDPR**: Data protection requirements
- **PCI DSS**: Payment card security standards

### Audit Trail

All security events are logged for audit:

```typescript
// Security audit log
{
  timestamp: "2025-01-10T10:00:00Z",
  event: "secret_detected",
  component: "ci_security",
  severity: "CRITICAL",
  details: {
    pattern: "firebase_api_key",
    file: "src/config.ts",
    line: 15
  }
}
```

---

## Future Enhancements

### Planned Improvements

1. **Advanced Pattern Detection**: Machine learning-based secret detection
2. **Real-time Scanning**: Pre-commit hooks for immediate feedback
3. **Secret Rotation Automation**: Automated secret rotation workflows
4. **Compliance Reporting**: Automated compliance report generation

### Integration Opportunities

1. **Vault Integration**: HashiCorp Vault for advanced secret management
2. **Cloud KMS**: Google Cloud KMS for encryption key management
3. **Security Orchestration**: Integration with security incident response tools
