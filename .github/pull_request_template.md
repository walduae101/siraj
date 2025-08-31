## Dev Bridge Checklist
- [ ] Local UI runs with hot reload
- [ ] Proxy on localhost only (`/api/dev-proxy/*`) — guard returns 403 for non-localhost
- [ ] Proxied `/api/dev-proxy/public-config` returns JSON (or JSON error envelope)
- [ ] `x-dev-proxy: 1` header observed on proxied responses
- [ ] Toggle tested: `localStorage.setItem('siraj.dev.remote','0'|'1')` (no restart)
- [ ] (If used) Auth flow tested: proxied `/api/dev-proxy/chats` returns 200 after Google login
- [ ] No `.env` files; no `process.env` in app code; GSM remains sole config source
