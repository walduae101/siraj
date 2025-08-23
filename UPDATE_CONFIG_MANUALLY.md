# Manual Config.json Update Guide

## 🎯 Your Current Status

Based on your current configuration, you have:
- ✅ **PayNow API Key**: `pnapi_v1_DAMjmqeD4F95QAdMnRsAysJZpv1N1jPAiXXXGwic4HcH`
- ✅ **PayNow Webhook Secret**: `pn-c5bb14674f5e437c99873be4648e1ab6`
- ✅ **PayNow Store ID**: `321641745957789696`
- ⚠️ **Missing**: PayNow Product IDs, Google OAuth, Firebase, OpenAI

## 🔧 What You Need to Do

### 1. PayNow Product IDs (Required)

Go to your PayNow Merchant Portal and create these products:

| Product | Name | Price | Points |
|---------|------|-------|--------|
| points_20 | "20 Points" | $2.00 | 20 |
| points_50 | "50 Points" | $5.00 | 50 |
| points_150 | "150 Points" | $15.00 | 150 |
| points_500 | "500 Points" | $50.00 | 500 |

After creating them, copy the Product IDs and update your config.

### 2. Google OAuth (Required for Authentication)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "Siraj Web App"
   - Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Client Secret

### 3. Firebase (Required for Database)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the project ID from the JSON

### 4. OpenAI (Optional for AI features)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys
3. Create a new secret key
4. Copy the key (starts with `sk-`)

## 📝 Update Your Config File

Edit `c:\var\secrets\siraj\config.json` and update these fields:

```json
{
  "paynow": {
    "apiKey": "pnapi_v1_DAMjmqeD4F95QAdMnRsAysJZpv1N1jPAiXXXGwic4HcH",
    "webhookSecret": "pn-c5bb14674f5e437c99873be4648e1ab6",
    "storeId": "321641745957789696",
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
  "subscriptions": {
    "plans": {
      "basic_monthly": {
        "name": "Basic Monthly",
        "cycle": "month",
        "pointsPerCycle": 50
      },
      "basic_yearly": {
        "name": "Basic Yearly",
        "cycle": "year",
        "pointsPerCycle": 600
      },
      "premium_monthly": {
        "name": "Premium Monthly",
        "cycle": "month",
        "pointsPerCycle": 150
      },
      "premium_yearly": {
        "name": "Premium Yearly",
        "cycle": "year",
        "pointsPerCycle": 1800
      }
    },
    "pointsKind": "promo",
    "pointsExpireDays": 365,
    "topupLazy": true,
    "cronSecret": "GENERATED_CRON_SECRET"
  },
  "features": {
    "FEAT_POINTS": true,
    "FEAT_SUB_POINTS": true,
    "PAYNOW_LIVE": true,
    "STUB_CHECKOUT": false,
    "webhookMode": "sync",
    "PRODUCT_SOT": "firestore",
    "ALLOW_NEGATIVE_BALANCE": true,
    "RECONCILIATION_ENABLED": true,
    "BACKFILL_ENABLED": true,
    "ENVIRONMENT": "prod",
    "RATE_LIMIT_ENABLED": true,
    "RISK_HOLDS_ENABLED": true,
    "FRAUD_SHADOW_MODE": false,
    "EDGE_RATE_LIMIT_ENABLED": true,
    "APP_RATE_LIMIT_ENABLED": true
  }
}
```

## 🔑 Generate Cron Secret

Run this in PowerShell to generate a secure cron secret:

```powershell
$cronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Generated cron secret: $cronSecret"
```

Replace `"GENERATED_CRON_SECRET"` with the generated value.

## 🚀 After Updating Config

1. **Upload to Google Secret Manager**:
   ```bash
   gcloud secrets versions add siraj-config --data-file="c:\var\secrets\siraj\config.json"
   ```

2. **Test your application**:
   ```bash
   npm run build
   npm run dev
   ```

## ✅ Priority Order

1. **High Priority** (Required for basic functionality):
   - PayNow Product IDs
   - Google OAuth Client ID/Secret
   - Firebase Project ID

2. **Medium Priority** (Required for full features):
   - Firebase Service Account JSON
   - Cron Secret

3. **Low Priority** (Optional features):
   - OpenAI API Key
   - reCAPTCHA keys
   - App Check keys

## 🔒 Security Reminder

- Never commit API keys to version control
- Use Google Secret Manager for production
- Rotate keys regularly
- Use different keys for different environments

## 📞 Need Help?

- **PayNow**: Contact PayNow merchant support
- **Google Cloud**: Use Google Cloud support
- **Firebase**: Use Firebase support
- **OpenAI**: Use OpenAI support
