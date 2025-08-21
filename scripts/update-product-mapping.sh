#!/bin/bash
# Script to update product mapping in Google Secret Manager
# Adds the missing product ID that was causing credits to fail

PROJECT_ID="walduae-project-20250809071906"
SECRET_NAME="siraj-config"

echo "📦 Updating product mapping in Secret Manager..."

# Get current secret
echo "📥 Fetching current configuration..."
gcloud secrets versions access latest \
  --secret="$SECRET_NAME" \
  --project="$PROJECT_ID" > current-config.json

# Create updated config with the missing product ID
echo "✏️ Adding missing product ID 321641745958305792..."
cat current-config.json | \
  sed 's/"products": {/"products": {\n      "321641745958305792": "50",/' > updated-config.json

# Show the diff
echo "📊 Changes to be applied:"
diff -u current-config.json updated-config.json | head -20

echo ""
read -p "❓ Apply these changes to Secret Manager? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Create new secret version
  echo "🚀 Creating new secret version..."
  gcloud secrets versions add "$SECRET_NAME" \
    --data-file=updated-config.json \
    --project="$PROJECT_ID"
  
  echo "✅ Product mapping updated successfully!"
  echo "⏱️ Cloud Run will pick up the changes within 60 seconds (TTL cache)"
else
  echo "❌ Update cancelled"
fi

# Cleanup
rm -f current-config.json updated-config.json

echo "🧹 Cleanup complete"
