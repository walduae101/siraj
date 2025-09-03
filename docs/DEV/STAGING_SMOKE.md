# Staging Smoke (Auth + Proxy)

## Pre-deployment Checklist

### Authentication Flow
- [ ] `/api/health` → 200
- [ ] `/login` → Google popup → POST `/api/auth/session-login` → 200 with Set-Cookie
- [ ] `/api/me` → 200 { ok:true } when authenticated
- [ ] `/dashboard` → loads, hard refresh still logged in
- [ ] Logout → clears cookie, redirects to login

### Security Headers
- [ ] COOP = `same-origin-allow-popups` (for Google popup)
- [ ] HSTS = `max-age=31536000; includeSubDomains; preload`
- [ ] X-Content-Type-Options = `nosniff`
- [ ] X-Frame-Options = `SAMEORIGIN`
- [ ] Referrer-Policy = `strict-origin-when-cross-origin`

### Production Cookies
- [ ] `secure=true` (HTTPS only)
- [ ] `domain=.siraj.life` (scoped to production)
- [ ] `httpOnly=true` (server-side only)
- [ ] `sameSite=lax` (CSRF protection)
- [ ] `path=/` (site-wide access)

### Proxy & CDN
- [ ] Static assets cached with immutable headers
- [ ] API routes no-cache
- [ ] HTML pages no-cache
- [ ] CSP headers properly configured

## Test Commands

```bash
# Health check
curl -I https://staging.siraj.life/api/health

# Auth endpoints (should be 401 when not logged in)
curl -I https://staging.siraj.life/api/me

# Headers verification
curl -I https://staging.siraj.life/ | grep -E "(Cross-Origin-Opener-Policy|Strict-Transport-Security|X-Content-Type-Options)"

# Cookie verification (after login)
curl -I https://staging.siraj.life/dashboard | grep -E "Set-Cookie"
```

## Rollback Criteria

- [ ] Authentication fails
- [ ] Dashboard inaccessible
- [ ] Security headers missing
- [ ] Cookies not scoped correctly
- [ ] CSP blocking legitimate content
