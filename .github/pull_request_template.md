## Dev Bridge Checklist (port 3000)
- [ ] Proxied `/api/dev-proxy/public-config` returns JSON (or JSON error envelope)
- [ ] Local `/api/public-config` returns 200 JSON
- [ ] Proxy guard: non-local Host → 403 JSON
- [ ] `x-dev-proxy: 1` header observed on proxied responses
- [ ] Toggle: `localStorage.setItem('siraj.dev.remote','0'|'1')` works without restart
- [ ] Google login + proxied `/api/dev-proxy/chats` works (200 after login)
- [ ] No .env files; no `process.env` in app code (GSM-only)
