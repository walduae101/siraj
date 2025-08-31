# Local Frontend + Remote Backend Development

## Overview

This setup allows you to run the Next.js frontend locally with hot reload while all API calls are proxied to the deployed backend (production or staging). This provides the best development experience with instant UI updates while using real backend data.

## How It Works

### Dev Proxy Route
- **Path**: `/api/_dev/remote/[...path]`
- **Purpose**: Forwards requests to the remote backend
- **Host Restriction**: Only works on `localhost` and `127.0.0.1`
- **Headers**: Preserves all headers except `host`, adds `x-dev-proxy: 1`

### API Client Wrapper
- **File**: `src/lib/api.ts`
- **Function**: `apiFetch(path, init)`
- **Behavior**: 
  - On localhost: Uses `/api/_dev/remote/` prefix
  - On production: Uses `/api/` prefix
  - Automatically adds Firebase ID token as Bearer token

## When to Use

✅ **Use this setup when:**
- Developing UI components with hot reload
- Testing frontend changes without backend deployment
- Working on client-side features
- Need instant feedback on UI changes

❌ **Don't use this setup when:**
- Developing backend API endpoints
- Testing server-side functionality
- Debugging backend issues
- Working on database schema changes

## Authentication (Bearer ID Token)

The system uses Firebase ID tokens for authentication instead of cookies to avoid cross-site issues:

```javascript
// Client-side: Token is automatically attached
const response = await apiFetch("chats");
// Headers: Authorization: Bearer <firebase-id-token>

// Server-side: Token is verified by requireUser()
const user = await requireUser(); // Verifies Bearer token
```

### Getting ID Token
```javascript
// In browser console after Google sign-in:
const token = await auth.currentUser.getIdToken(true);
console.log(token.substring(0, 10) + "..."); // Show first 10 chars only
```

## Limitations (No Cookies)

Since we're proxying to a remote backend, we avoid cookies to prevent cross-site issues:

- ❌ No session cookies
- ❌ No `Set-Cookie` headers forwarded
- ✅ Firebase ID tokens work perfectly
- ✅ All authentication via Bearer tokens

## Configuration

### Remote Backend URL
```typescript
// src/config/dev-bridge.ts
export const REMOTE_BASE = 'https://siraj.life'; // or staging URL
```

### Host Detection
```typescript
export function isLocalHost(host: string | null): boolean {
  // Only allows localhost and 127.0.0.1
}
```

## Usage Examples

### Basic API Call
```javascript
import { apiFetch } from "~/lib/api";

// This will use /api/_dev/remote/chats on localhost
// and /api/chats on production
const response = await apiFetch("chats");
const chats = await response.json();
```

### With Authentication
```javascript
// Firebase ID token is automatically attached
const response = await apiFetch("chats", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "New Chat" })
});
```

### Testing in Browser Console
```javascript
// After Google sign-in:
const token = await auth.currentUser.getIdToken(true);

// Test chats endpoint
fetch('/api/_dev/remote/chats', { 
  headers: { Authorization: `Bearer ${token}` } 
})
.then(r => r.status)
.then(console.log); // Should return 200

// Test messages endpoint
fetch('/api/_dev/remote/chats/someId/messages', { 
  headers: { Authorization: `Bearer ${token}` } 
})
.then(r => r.status)
.then(console.log); // Should return 200
```

## Troubleshooting

### 404 on Dev Proxy
**Problem**: Getting 404 when accessing `/api/_dev/remote/*`
**Solution**: Ensure you're on `localhost:3000` or `127.0.0.1:3000`

### Authentication Errors
**Problem**: Getting 401/403 errors
**Solution**: 
1. Sign in with Google first
2. Check that ID token is being sent: `auth.currentUser.getIdToken(true)`
3. Verify token is not expired

### Network Errors
**Problem**: Connection refused or timeout
**Solution**:
1. Check `REMOTE_BASE` URL is correct
2. Verify remote backend is running
3. Check network connectivity

### CORS Issues
**Problem**: CORS errors in browser
**Solution**: This shouldn't happen since we're proxying through the same origin. If it does, check the proxy route implementation.

## Security Notes

- ✅ Proxy only works on localhost
- ✅ No secrets exposed in client code
- ✅ Firebase ID tokens are short-lived
- ✅ Remote backend validates all requests
- ❌ Don't commit sensitive tokens
- ❌ Don't log full ID tokens

## Development Workflow

1. **Start local dev**: `pnpm dev`
2. **Sign in with Google**: Visit `/auth/login`
3. **Test API calls**: Use browser console or components
4. **Hot reload**: Edit UI components and see instant changes
5. **Backend changes**: Deploy to staging/production to test

## Monitoring

### Network Tab
Look for requests to `/api/_dev/remote/*` with:
- `x-dev-proxy: 1` header
- `Authorization: Bearer <token>` header
- 200 status codes

### Console Logs
The proxy logs errors to console:
```javascript
console.error('Dev proxy error:', error);
```

### Remote Backend Logs
Look for requests with `x-dev-proxy: 1` header to identify proxied requests.
