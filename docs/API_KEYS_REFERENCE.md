# API Keys and Secrets Reference Guide

This guide provides information about all the API keys and secrets required for the Siraj application.

## 🔑 Required API Keys and Secrets

### 1. PayNow Configuration
**Status**: ✅ Already configured in your config

- **API Key**: `<YOUR_PAYNOW_API_KEY>`
- **Webhook Secret**: `<YOUR_PAYNOW_WEBHOOK_SECRET>`
- **Store ID**: `321641745957789696`

**Where to get them**: PayNow Merchant Portal
- Login to your PayNow merchant account
- Go to API Settings
- Generate or copy your API key and webhook secret

### 2. PayNow Product IDs
**Status**: ⚠️ Need to configure

You need to create products in PayNow and get their IDs:
- **20 Points Product ID**: Create a product for 20 points
- **50 Points Product ID**: Create a product for 50 points  
- **150 Points Product ID**: Create a product for 150 points
- **500 Points Product ID**: Create a product for 500 points

**How to create**:
1. Go to PayNow Merchant Portal
2. Navigate to Products
3. Create new products with appropriate names and prices
4. Copy the Product IDs

### 3. Google OAuth Configuration
**Status**: ❌ Need to configure

- **Google Client ID**: OAuth 2.0 client ID for web application
- **Google Client Secret**: OAuth 2.0 client secret

**How to get them**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create a new OAuth 2.0 Client ID
4. Set authorized redirect URIs (e.g., `https://your-domain.com/api/auth/callback/google`)
5. Copy Client ID and Client Secret

### 4. Firebase Configuration
**Status**: ⚠️ Partially configured

- **Project ID**: Your Firebase project ID
- **Service Account JSON**: Firebase service account key file

**How to get them**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the project ID from the JSON file

### 5. OpenAI API Key
**Status**: ❌ Need to configure

- **OpenAI API Key**: Your OpenAI API key for AI features

**How to get it**:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys
3. Create a new secret key
4. Copy the key (starts with `sk-`)

### 6. reCAPTCHA Enterprise
**Status**: ❌ Need to configure

- **Site Key**: reCAPTCHA Enterprise site key
- **Project ID**: Google Cloud project ID for reCAPTCHA

**How to get them**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Security > reCAPTCHA Enterprise
3. Create a new site key
4. Copy the site key and project ID

### 7. Firebase App Check
**Status**: ❌ Need to configure

- **Public Key**: Firebase App Check public key

**How to get it**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to App Check
3. Enable App Check for your app
4. Copy the public key

## 🚀 Quick Setup Commands

### Run the Interactive Config Update Script
```powershell
.\scripts\update-config-with-real-values.ps1
```

### Manual Configuration Update
If you prefer to update manually, edit `c:\var\secrets\siraj\config.json`:

```json
{
  "paynow": {
    "apiKey": "YOUR_PAYNOW_API_KEY",
    "webhookSecret": "YOUR_WEBHOOK_SECRET", 
    "storeId": "YOUR_STORE_ID",
    "products": {
      "points_20": "YOUR_PRODUCT_ID_1",
      "points_50": "YOUR_PRODUCT_ID_2",
      "points_150": "YOUR_PRODUCT_ID_3",
      "points_500": "YOUR_PRODUCT_ID_4"
    }
  },
  "auth": {
    "nextAuthUrl": "https://your-domain.com",
    "googleClientId": "YOUR_GOOGLE_CLIENT_ID",
    "googleClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
  },
  "firebase": {
    "projectId": "your-firebase-project-id",
    "serviceAccountJson": "FIREBASE_SERVICE_ACCOUNT_JSON"
  },
  "openai": {
    "apiKey": "YOUR_OPENAI_API_KEY"
  },
  "fraud": {
    "recaptchaSiteKey": "YOUR_RECAPTCHA_SITE_KEY",
    "recaptchaProject": "your-recaptcha-project-id",
    "appCheckPublicKeys": ["YOUR_APP_CHECK_PUBLIC_KEY"]
  }
}
```

## 🔒 Security Best Practices

### 1. API Key Management
- ✅ Store all API keys in Google Secret Manager
- ✅ Never commit API keys to version control
- ✅ Use different keys for different environments
- ✅ Rotate keys regularly

### 2. Environment Separation
- **Development**: Use test/sandbox API keys
- **Staging**: Use staging API keys
- **Production**: Use production API keys

### 3. Access Control
- Limit API key permissions to minimum required
- Use service accounts with least privilege
- Enable audit logging for all API access

## 📋 Configuration Checklist

### PayNow
- [ ] API Key configured
- [ ] Webhook Secret configured
- [ ] Store ID configured
- [ ] Product IDs configured

### Authentication
- [ ] Google OAuth Client ID configured
- [ ] Google OAuth Client Secret configured
- [ ] NextAuth URL configured

### Firebase
- [ ] Project ID configured
- [ ] Service Account JSON configured

### OpenAI
- [ ] API Key configured

### Fraud Detection
- [ ] reCAPTCHA Site Key configured
- [ ] reCAPTCHA Project ID configured
- [ ] App Check Public Key configured

### Environment
- [ ] Environment set to appropriate value (test/staging/prod)
- [ ] Fraud shadow mode configured appropriately

## 🛠️ Troubleshooting

### Common Issues

1. **Invalid API Key**
   - Verify the API key is correct
   - Check if the key has expired
   - Ensure the key has proper permissions

2. **Webhook Verification Failed**
   - Verify webhook secret is correct
   - Check webhook URL configuration
   - Ensure HTTPS is used for webhooks

3. **OAuth Authentication Failed**
   - Verify Client ID and Secret are correct
   - Check authorized redirect URIs
   - Ensure domain is properly configured

4. **Firebase Connection Failed**
   - Verify Project ID is correct
   - Check Service Account JSON is valid
   - Ensure Firebase project is active

### Testing Configuration

After updating your configuration:

1. **Test PayNow Integration**:
   ```bash
   # Test API key
   curl -H "Authorization: Bearer YOUR_PAYNOW_API_KEY" \
        https://api.paynow.com.sg/v1/merchant/status
   ```

2. **Test OpenAI Integration**:
   ```bash
   # Test API key
   curl -H "Authorization: Bearer YOUR_OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Test Application**:
   ```bash
   npm run build
   npm run dev
   ```

## 📞 Support

If you need help with any API keys or configuration:

- **PayNow**: Contact PayNow merchant support
- **Google Cloud**: Use Google Cloud support
- **Firebase**: Use Firebase support
- **OpenAI**: Use OpenAI support
- **General**: Check the main documentation

## 🔄 Next Steps

1. **Run the interactive script** to update your configuration
2. **Test all integrations** to ensure they work
3. **Upload to Secret Manager** for production use
4. **Deploy your application** with the new configuration
5. **Monitor logs** for any issues
