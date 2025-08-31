# Dev Bridge Quickstart

## Overview
- Local UI with hot reload, real hosted backend via `/api/dev-proxy` on localhost.
- Toggle remote: `localStorage.setItem('siraj.dev.remote','1'|'0')` then reload.
- Auth: Firebase Google Sign-In; proxy forwards Bearer ID token (no cookies).
- Proxy guard: localhost-only; returns 403 JSON for non-local hosts.
- Troubleshooting: If upstream returns HTML, you'll get `502 upstream-non-json` with a small `sample`.

## Quick Start
1. Start dev server: `pnpm dev`
2. Open browser to `http://localhost:3000`
3. Use the dev banner to toggle between local/remote backends
4. Or manually: `localStorage.setItem('siraj.dev.remote', '1')` then reload

## Smoke Tests
Run after starting dev server:
- **Linux/Mac**: `scripts/smoke-dev-bridge.sh`
- **Windows**: `pwsh scripts/smoke-dev-bridge.ps1`

## Authentication
- Sign in with Google via Firebase Auth
- Proxy automatically forwards `Authorization: Bearer <token>` headers
- No session cookies - uses ID tokens only

## Troubleshooting
- **502 upstream-non-json**: Remote returned HTML instead of JSON (check `sample` field)
- **403 forbidden-non-localhost**: Proxy guard working (expected for non-localhost)
- **500 upstream-fetch-failed**: Network issue reaching remote backend

## Configuration
- **Remote Base**: `https://siraj.life`
- **API Prefix**: `/api`
- **Proxy Path**: `/api/dev-proxy/[...path]`
- **Toggle Key**: `siraj.dev.remote` in localStorage
