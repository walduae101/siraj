# Config.json Setup Guide with Real API Keys

## 🎯 Current Status

Your current configuration has:
- ✅ **PayNow API Key**: Already configured
- ✅ **PayNow Webhook Secret**: Already configured  
- ✅ **PayNow Store ID**: Already configured
- ⚠️ **Missing**: PayNow Product IDs, Google OAuth, Firebase, OpenAI, and other integrations

## 🔧 Step-by-Step Configuration Update

### Step 1: PayNow Product IDs

You need to create products in PayNow and get their IDs. Here's how:

1. **Go to PayNow Merchant Portal**
2. **Navigate to Products**
3. **Create these products**:
   - **20 Points Product**: Name: "20 Points", Price: $2.00
   - **50 Points Product**: Name: "50 Points", Price: $5.00
   - **150 Points Product**: Name: "150 Points", Price: $15.00
   - **500 Points Product**: Name: "500 Points", Price: $50.00
4. **Copy the Product IDs** and update your config:

```json
"products": {
  "points_20": "YOUR_PRODUCT_ID_1",
  "points_50": "YOUR_PRODUCT_ID_2", 
  "points_150": "YOUR_PRODUCT_ID_3",
  "points_500": "YOUR_PRODUCT_ID_4"
}
```

### Step 2: Google OAuth Configuration

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Navigate to APIs & Services > Credentials**
3. **Create OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: "Siraj Web App"
   - Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
4. **Copy Client ID and Client Secret**

### Step 3: Firebase Configuration

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**
3. **Go to Project Settings > Service Accounts**
4. **Click "Generate new private key"**
5. **Download the JSON file**
6. **Copy the project ID from the JSON**

### Step 4: OpenAI API Key

1. **Go to [OpenAI Platform](https://platform.openai.com/)**
2. **Navigate to API Keys**
3. **Create a new secret key**
4. **Copy the key** (starts with `sk-`)

### Step 5: Update Your Config

Edit `c:\var\secrets\siraj\config.json` and update these sections:

```json
{
  "paynow": {
    "apiKey": "<YOUR_PAYNOW_API_KEY>",
    "webhookSecret": "<YOUR_PAYNOW_WEBHOOK_SECRET>",
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

### Step 6: Generate Cron Secret

Run this PowerShell command to generate a secure cron secret:

```powershell
$cronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Generated cron secret: $cronSecret"
```

Then update the `cronSecret` field in your config.

### Step 7: Upload to Google Secret Manager

After updating your config, upload it to Google Secret Manager:

```bash
gcloud secrets versions add siraj-config --data-file="c:\var\secrets\siraj\config.json"
```

### Step 8: Test Your Configuration

```bash
npm run build
npm run dev
```

## 🔑 API Key Sources Summary

| Service | Where to Get | Status |
|---------|-------------|---------|
| PayNow API Key | PayNow Merchant Portal | ✅ Done |
| PayNow Webhook Secret | PayNow Merchant Portal | ✅ Done |
| PayNow Store ID | PayNow Merchant Portal | ✅ Done |
| PayNow Product IDs | PayNow Merchant Portal > Products | ⚠️ Need to create |
| Google OAuth Client ID | Google Cloud Console > Credentials | ❌ Need to create |
| Google OAuth Client Secret | Google Cloud Console > Credentials | ❌ Need to create |
| Firebase Project ID | Firebase Console > Project Settings | ❌ Need to get |
| Firebase Service Account | Firebase Console > Service Accounts | ❌ Need to download |
| OpenAI API Key | OpenAI Platform > API Keys | ❌ Need to create |
| Cron Secret | Generate locally | ⚠️ Need to generate |

## 🚀 Quick Commands

### Generate Cron Secret
```powershell
$cronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Generated cron secret: $cronSecret"
```

### View Current Config
```powershell
Get-Content "c:\var\secrets\siraj\config.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Upload to Secret Manager
```bash
gcloud secrets versions add siraj-config --data-file="c:\var\secrets\siraj\config.json"
```

### Test Application
```bash
npm run build
npm run dev
```

## 🔒 Security Notes

1. **Never commit API keys to version control**
2. **Use Google Secret Manager for production**
3. **Rotate keys regularly**
4. **Use different keys for different environments**
5. **Enable audit logging**

## 📞 Need Help?

- **PayNow**: Contact PayNow merchant support
- **Google Cloud**: Use Google Cloud support
- **Firebase**: Use Firebase support
- **OpenAI**: Use OpenAI support

## ✅ Checklist

- [ ] PayNow Product IDs configured
- [ ] Google OAuth Client ID and Secret configured
- [ ] Firebase Project ID configured
- [ ] Firebase Service Account JSON configured
- [ ] OpenAI API Key configured
- [ ] Cron Secret generated
- [ ] Environment set to appropriate value
- [ ] Config uploaded to Google Secret Manager
- [ ] Application tested and working
