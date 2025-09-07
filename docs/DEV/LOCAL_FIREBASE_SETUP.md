# Local Firebase Setup Guide

## Problem

The current setup uses mock Firebase configuration which causes authentication to fail with "API key not valid" errors.

## Solution Options

### Option 1: Use Real Firebase Config (Recommended)

For local development with real Firebase authentication:

1. **Create a `.env.local` file** in your project root:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_real_firebase_api_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_real_firebase_project_id
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_real_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_APP_ID=your_real_firebase_app_id
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_real_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_real_storage_bucket
   
   # App Configuration
   NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
   NEXT_PUBLIC_PAYNOW_STORE_ID=your_paynow_store_id
   NEXT_PUBLIC_BACKGROUND_IMAGE_URL=your_background_image_url
   NEXT_PUBLIC_DISCORD_INVITE_URL=your_discord_invite_url
   NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE=your_connection_message
   ```

2. **Get your Firebase config** from the Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → General
   - Scroll down to "Your apps" section
   - Copy the config values

3. **Restart your development server**:
   ```bash
   pnpm dev
   ```

4. **Test the setup**:
   - Visit `http://localhost:3000/login`
   - Click "Continue with Google"
   - Authentication should work with real Firebase

### Option 2: Use Firebase Auth Emulator (Advanced)

For completely local authentication without real Firebase:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**:
   ```bash
   firebase init emulators
   ```

4. **Start the Auth emulator**:
   ```bash
   firebase emulators:start --only auth
   ```

5. **Configure your app to use the emulator** (requires code changes)

### Option 3: Use Mock Config (Current - Limited)

The current mock config will show authentication errors but allows UI development:

- ✅ **UI development works**
- ❌ **Authentication fails** (expected)
- ❌ **Google sign-in doesn't work**

## Current Behavior

The system will automatically detect and use:

1. **Real Firebase config** from `.env.local` (if available)
2. **Mock config** (if no real config found)

## Testing

After setup, verify:

```bash
# Check if config is loaded correctly
curl http://localhost:3000/api/public-config

# Should return real Firebase config if .env.local is set up
# Should return mock config if no .env.local
```

## Troubleshooting

### "API key not valid" Error
- **Cause**: Using mock Firebase config
- **Solution**: Set up real Firebase config in `.env.local`

### "authDomain" Issues
- **Cause**: Wrong auth domain configuration
- **Solution**: Use `localhost:3000` for local development

### CSP Errors
- **Cause**: Content Security Policy blocking Firebase iframes
- **Solution**: Configure CSP to allow Firebase domains

## Next Steps

1. **For immediate development**: Use Option 1 (real Firebase config)
2. **For production**: Configure remote backend with GSM secrets
3. **For advanced local development**: Use Option 2 (Firebase emulator)
