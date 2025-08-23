# Quick Setup Template - Copy & Paste

## 🔧 Step 1: Generate Cron Secret

Run this PowerShell command to generate a secure cron secret:

```powershell
$cronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Generated cron secret: $cronSecret"
```

Copy the generated secret and replace `REPLACE_WITH_GENERATED_CRON_SECRET` in the config.

## 🔧 Step 2: Get API Keys

### PayNow Product IDs
1. Go to PayNow Merchant Portal > Products
2. Create these products:
   - **20 Points**: Name: "20 Points", Price: $2.00
   - **50 Points**: Name: "50 Points", Price: $5.00
   - **150 Points**: Name: "150 Points", Price: $15.00
   - **500 Points**: Name: "500 Points", Price: $50.00
3. Copy the Product IDs and replace:
   - `REPLACE_WITH_PAYNOW_PRODUCT_ID_1` → Your 20 points product ID
   - `REPLACE_WITH_PAYNOW_PRODUCT_ID_2` → Your 50 points product ID
   - `REPLACE_WITH_PAYNOW_PRODUCT_ID_3` → Your 150 points product ID
   - `REPLACE_WITH_PAYNOW_PRODUCT_ID_4` → Your 500 points product ID

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Set redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Replace:
   - `REPLACE_WITH_GOOGLE_CLIENT_ID` → Your Google Client ID
   - `REPLACE_WITH_GOOGLE_CLIENT_SECRET` → Your Google Client Secret

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/) > Project Settings > Service Accounts
2. Click "Generate new private key" and download JSON
3. Replace:
   - `REPLACE_WITH_FIREBASE_PROJECT_ID` → Your Firebase Project ID
   - `REPLACE_WITH_FIREBASE_SERVICE_ACCOUNT_JSON` → The entire JSON content

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/) > API Keys
2. Create new secret key
3. Replace:
   - `REPLACE_WITH_OPENAI_API_KEY` → Your OpenAI API Key (starts with sk-)

### Optional: reCAPTCHA & App Check
1. Go to Google Cloud Console > Security > reCAPTCHA Enterprise
2. Create site key
3. Replace:
   - `REPLACE_WITH_RECAPTCHA_SITE_KEY` → Your reCAPTCHA Site Key
   - `REPLACE_WITH_RECAPTCHA_PROJECT_ID` → Your reCAPTCHA Project ID
   - `REPLACE_WITH_APP_CHECK_PUBLIC_KEY` → Your App Check Public Key

## 🔧 Step 3: Update Domain

Replace `https://your-domain.com` with your actual domain.

## 🔧 Step 4: Copy Final Config

After replacing all placeholders, copy the entire config and save it as `c:\var\secrets\siraj\config.json`

## 🔧 Step 5: Upload to Secret Manager

```bash
gcloud secrets versions add siraj-config --data-file="c:\var\secrets\siraj\config.json"
```

## 🔧 Step 6: Test

```bash
npm run build
npm run dev
```

## 📋 Checklist

- [ ] Generated cron secret
- [ ] Created PayNow products and got IDs
- [ ] Created Google OAuth credentials
- [ ] Downloaded Firebase service account
- [ ] Created OpenAI API key
- [ ] Updated domain URL
- [ ] Replaced all placeholders in config
- [ ] Uploaded to Secret Manager
- [ ] Tested application
