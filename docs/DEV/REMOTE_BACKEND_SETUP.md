# Remote Backend Setup Guide

## Current Status

The remote backend at `https://siraj.life` is accessible but doesn't have Firebase configuration set up in Google Secret Manager.

## To Enable Real Firebase Authentication

### Option 1: Configure Remote Backend (Recommended for Production)

1. **Set up Google Secret Manager on the remote backend** with these secrets:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_PROJECT_ID  
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   ```

2. **Ensure the remote backend has the `/api/public-config` endpoint implemented**

3. **Test the configuration**:
   ```bash
   curl https://siraj.life/api/public-config
   ```

### Option 2: Use Local Development (Current Setup)

The local development environment uses mock Firebase configuration for testing:

- **Local config**: Mock Firebase config (development only)
- **Proxy fallback**: Routes to remote backend via `/api/dev-proxy/*`
- **Direct fallback**: Tries remote backend directly

## Dev Bridge Configuration

The dev bridge is configured to:
- **Remote base**: `https://siraj.life`
- **API prefix**: `/api`
- **Localhost guard**: Only allows proxy access from localhost

## Testing the Setup

1. **Local development**:
   ```bash
   pnpm dev
   # Visit http://localhost:3000/login
   ```

2. **Check config endpoints**:
   ```bash
   # Local config (mock in dev)
   curl http://localhost:3000/api/public-config
   
   # Proxy to remote
   curl http://localhost:3000/api/dev-proxy/public-config
   
   # Direct remote
   curl https://siraj.life/api/public-config
   ```

## Current Fallback Chain

1. **Local config** (`/api/public-config`) → Mock config in development
2. **Proxy config** (`/api/dev-proxy/public-config`) → Remote via proxy
3. **Direct remote** (`https://siraj.life/api/public-config`) → Remote directly
4. **Error handling** → User-friendly Arabic error message

## Next Steps

To enable real Firebase authentication:

1. Configure the remote backend with real Firebase secrets
2. Test the `/api/public-config` endpoint returns 200 with real config
3. The dev bridge will automatically use the real config
4. Google sign-in will work with real Firebase project
