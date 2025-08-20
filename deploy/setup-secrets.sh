#!/bin/bash
# Script to create Google Secret Manager secrets for Siraj

PROJECT_ID="walduae-project-20250809071906"
REGION="us-central1"

# Create the main config secret
echo "Creating siraj-config secret..."
gcloud secrets create siraj-config \
  --project=$PROJECT_ID \
  --replication-policy="automatic" \
  --data-file="../secrets/siraj-config.json"

# Grant Cloud Run service account access
echo "Granting Cloud Run access to secrets..."
SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding siraj-config \
  --project=$PROJECT_ID \
  --role="roles/secretmanager.secretAccessor" \
  --member="serviceAccount:${SERVICE_ACCOUNT}"

# Optional: Create public config secret
if [ -f "../secrets/siraj-public-config.json" ]; then
  echo "Creating siraj-public-config secret..."
  gcloud secrets create siraj-public-config \
    --project=$PROJECT_ID \
    --replication-policy="automatic" \
    --data-file="../secrets/siraj-public-config.json"

  gcloud secrets add-iam-policy-binding siraj-public-config \
    --project=$PROJECT_ID \
    --role="roles/secretmanager.secretAccessor" \
    --member="serviceAccount:${SERVICE_ACCOUNT}"
fi

echo "Done! You can now deploy with:"
echo "gcloud run services replace deploy/cloudrun-with-secrets.yaml --region=$REGION --project=$PROJECT_ID"
