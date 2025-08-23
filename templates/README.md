# Config Setup Templates

This folder contains templates to help you quickly set up your `config.json` with real API keys.

## 📁 Files in this folder:

### 1. `config-template.json`
**What it is**: Complete config.json template with placeholders
**How to use**: 
1. Copy the entire content
2. Replace all `REPLACE_WITH_*` placeholders with your real values
3. Save as `c:\var\secrets\siraj\config.json`

### 2. `quick-setup-template.md`
**What it is**: Step-by-step instructions for getting API keys
**How to use**: Follow the numbered steps to get all required API keys

### 3. `powershell-commands.txt`
**What it is**: PowerShell commands you can copy and paste
**How to use**: Copy individual commands and run them in PowerShell

### 4. `api-keys-checklist.txt`
**What it is**: Checklist to track your progress
**How to use**: Print or open in text editor and check off items as you complete them

## 🚀 Quick Start:

1. **Generate cron secret**:
   ```powershell
   $cronSecret = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   Write-Host "Generated cron secret: $cronSecret"
   ```

2. **Get API keys** (follow `quick-setup-template.md`)

3. **Update config** (use `config-template.json`)

4. **Upload to Secret Manager**:
   ```bash
   gcloud secrets versions add siraj-config --data-file="c:\var\secrets\siraj\config.json"
   ```

5. **Test**:
   ```bash
   npm run build
   npm run dev
   ```

## 🔑 What you already have:
- ✅ PayNow API Key
- ✅ PayNow Webhook Secret  
- ✅ PayNow Store ID

## ⚠️ What you need to get:
- PayNow Product IDs (create products in merchant portal)
- Google OAuth Client ID & Secret
- Firebase Project ID & Service Account JSON
- OpenAI API Key (optional)
- Cron Secret (generate locally)

## 📞 Need help?
- PayNow: Contact PayNow merchant support
- Google Cloud: Use Google Cloud support
- Firebase: Use Firebase support
- OpenAI: Use OpenAI support
