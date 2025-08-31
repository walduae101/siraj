# GSM Config Contract

## Overview
This document defines the configuration contract for the Siraj application, ensuring all configuration is managed through Google Secret Manager (GSM) with no local `.env` files or `process.env` usage in application code.

## Secret Naming Convention

### Firebase Public Configuration
All Firebase public configuration values use `NEXT_PUBLIC_*` secret names:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

### Server-Only Secrets
These secrets are only accessible server-side and never exposed to the client:
- `OPENAI_API_KEY`
- `PAYNOW_API_KEY`
- `PAYNOW_WEBHOOK_SECRET`

### Application Configuration
Public application settings exposed to the client:
- `NEXT_PUBLIC_WEBSITE_URL`
- `NEXT_PUBLIC_PAYNOW_STORE_ID`
- `NEXT_PUBLIC_BACKGROUND_IMAGE_URL`
- `NEXT_PUBLIC_DISCORD_INVITE_URL`
- `NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE`

### Feature Flags
Server-side feature configuration:
- `FEAT_SUB_POINTS`
- `SUB_POINTS_KIND`
- `SUB_POINTS_EXPIRE_DAYS`
- `SUB_TOPUP_LAZY`

## Security Requirements

1. **No `.env` files** in the codebase
2. **No `process.env` usage** in application code
3. **All secrets** loaded from Google Secret Manager
4. **Server-side only** access to sensitive secrets
5. **Public config** safely exposed via `/api/public-config`

## Access Control

- **Development**: Uses Application Default Credentials (ADC) via `gcloud auth application-default login`
- **Production**: Uses service account with minimal required permissions:
  - `roles/secretmanager.secretAccessor` for all secrets
  - `roles/datastore.user` for Firestore access

## Validation

CI/CD pipeline includes guards to prevent regressions:
- `scripts/ci-guard.sh` (Linux)
- `scripts/ci-guard.ps1` (Windows)

These guards verify:
- No `.env` files present
- No `process.env` usage in source code
