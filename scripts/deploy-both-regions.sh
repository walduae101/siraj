#!/bin/bash
# Deploy to both regions with the same image and purge CDN
# This script ensures both US and EU regions run the same image
set -e

echo "🚀 Deploying to both regions with same image..."

# Get the current US image (should be the latest from CI)
IMAGE=$(gcloud run services describe siraj --region=us-central1 \
  --format='value(spec.template.spec.containers[0].image)')

echo "Using image: $IMAGE"

# Update both regions to the same image
echo "📦 Updating US region..."
gcloud run services update siraj --region=us-central1 --image "$IMAGE" --quiet

echo "📦 Updating EU region..."
gcloud run services update siraj-eu --region=europe-west1 --image "$IMAGE" --quiet

# Purge CDN cache to ensure headers reflect new origin behavior
echo "🧹 Purging CDN cache..."
gcloud compute url-maps invalidate-cdn-cache siraj-web-map --path "/*" --quiet

echo "✅ Deployment complete! Both regions now running: $IMAGE"
echo ""
echo "🔍 Running verification tests..."

# Run verification scripts
if [ -f "./scripts/verify-origins.sh" ]; then
    echo "Testing origin parity..."
    ./scripts/verify-origins.sh
fi

if [ -f "./scripts/cdn-parity.sh" ]; then
    echo "Testing CDN parity..."
    ./scripts/cdn-parity.sh
fi

echo "🎯 Deployment and verification complete!"
