# GitHub Branch Protection Setup Guide

**Updated on: 2025-01-10**

---

## Overview

This guide provides step-by-step instructions for setting up GitHub branch protection rules to secure the `main` branch and enforce code quality standards.

---

## Step-by-Step Setup

### 1. Navigate to Branch Protection Settings

Go to: https://github.com/walduae101/siraj/settings/branches

### 2. Add Branch Protection Rule

1. Click **"Add rule"** or **"Add protection rule"**
2. **Branch name pattern**: `main`

### 3. Configure Protection Settings

#### **Protect matching branches** ✅
Check all of these:

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from code owners** (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - **Status checks to require**:
    - `Security Scan` (from our security.yml workflow)
    - `Dependency Security` (from our security.yml workflow)

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits** (optional but recommended)

#### **Restrict pushes that create matching branches** ✅
- ✅ **Restrict pushes that create matching branches**

#### **Rules applied to everyone including administrators** ✅
- ✅ **Do not allow bypassing the above settings**
- ✅ **Restrict force pushes**
- ✅ **Allow deletions** (uncheck this - should be disabled)

### 4. Save the Rule

Click **"Create"** or **"Save changes"**

---

## Alternative: Quick Setup with GitHub CLI

If you have GitHub CLI installed:

```bash
gh api repos/walduae101/siraj/branches/main/protection -X PUT --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Security Scan", "Dependency Security"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

---

## Expected Result

After setup, your main branch will:
- ✅ **Require pull requests** for all changes
- ✅ **Require code review** (1 approval minimum)
- ✅ **Require passing security checks** before merge
- ✅ **Block force pushes** and deletions
- ✅ **Enforce signed commits** (if enabled)

---

## Troubleshooting

### Status Checks Not Appearing
1. **Wait for first workflow run** - Status checks appear after the first GitHub Actions run
2. **Check workflow names** - Must match exactly: "Security Scan", "Dependency Security"
3. **Verify workflows are enabled** - Go to Actions tab and ensure workflows are active

### Protection Rules Not Working
1. **Check rule scope** - Ensure branch pattern is exactly `main`
2. **Verify permissions** - You need admin access to the repository
3. **Test with PR** - Create a test pull request to verify rules are enforced

---

## Security Validation

After setup, test the protection:

1. **Try direct push** (should be blocked):
   ```bash
   git push origin main
   # Should be rejected if not following protection rules
   ```

2. **Create pull request** (should require review):
   - Make a small change
   - Create PR
   - Verify review is required before merge

3. **Check status checks** (should show security scans):
   - PR should show "Security Scan" and "Dependency Security" checks
   - Both must pass before merge is allowed

---

## GitHub Security Features Status

Ensure all these are enabled at https://github.com/walduae101/siraj/settings/security_analysis:

- ✅ **Secret scanning** (detects secrets in code)
- ✅ **Push protection** (blocks secret pushes) 
- ✅ **Dependabot alerts** (security vulnerability notifications)
- ✅ **Dependabot security updates** (automatic dependency updates)
- ✅ **Code scanning** (CodeQL static analysis)

---

## Next Steps

After branch protection is configured:

1. **Test the protection** with a test pull request
2. **Update team workflow** to use pull requests for all changes
3. **Monitor security tab** for any new alerts
4. **Schedule quarterly review** of protection settings

---

This setup ensures your main branch is protected while maintaining development velocity through proper workflows.
