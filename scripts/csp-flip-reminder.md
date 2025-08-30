# CSP Enforcement Flip Reminder

**Date:** Sep 6, 2025 (Asia/Dubai timezone)

## Action Required

Flip CSP from Report-Only to Enforced mode.

## Steps

1. **Edit `next.config.mjs`**
   ```javascript
   // Change this line:
   { key: "Content-Security-Policy-Report-Only", value: "..." }
   
   // To this:
   { key: "Content-Security-Policy", value: "..." }
   ```

2. **Deploy the change**
   ```bash
   git add next.config.mjs
   git commit -m "feat(security): flip CSP from report-only to enforced"
   git push origin main
   ```

3. **Verify headers after deployment**
   ```bash
   # Check that CSP header is now enforced
   curl -sSI https://siraj.life | grep -i content-security-policy
   
   # Should show: Content-Security-Policy: (not Report-Only)
   ```

4. **Monitor for violations**
   - Watch `/api/csp-report` for any violations
   - Check browser console for CSP errors
   - Monitor application functionality

## Pre-Flip Checklist

- [ ] CSP reports have been clean for 7+ days
- [ ] No violations in browser console
- [ ] All functionality works as expected
- [ ] Team is aware of the change

## Rollback Plan

If issues occur after CSP enforcement:

1. **Revert the change**
   ```bash
   # Change back to Report-Only
   { key: "Content-Security-Policy-Report-Only", value: "..." }
   ```

2. **Deploy rollback**
   ```bash
   git add next.config.mjs
   git commit -m "revert: flip CSP back to report-only due to violations"
   git push origin main
   ```

3. **Investigate violations**
   - Check CSP reports for specific violations
   - Fix the underlying issues
   - Re-attempt enforcement when ready

## Monitoring Commands

```bash
# Check CSP header status
curl -sSI https://siraj.life | grep -i content-security-policy

# Check for CSP violations in logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload:content-security-policy" --limit=10

# Verify all headers still working
./scripts/cdn-parity.sh
```

## Success Criteria

- [ ] CSP header shows as `Content-Security-Policy` (not Report-Only)
- [ ] No CSP violations in browser console
- [ ] Application functionality unchanged
- [ ] All security headers still present
- [ ] Static assets still immutable
