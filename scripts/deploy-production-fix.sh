#!/bin/bash

# Production Fix Deployment Script
# This script applies the configuration fix to resolve 500 errors on siraj.life

set -e

echo "🚀 Siraj Production Fix Deployment"
echo "=================================="
echo ""

# Configuration
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-siraj-prod}"
SERVICE_NAME="siraj"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SECRET_NAME="siraj-config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI is not installed${NC}"
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    echo -e "${GREEN}✅ gcloud CLI found${NC}"
}

# Function to check authentication
check_auth() {
    echo "Checking Google Cloud authentication..."
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Not authenticated with Google Cloud${NC}"
        echo "Please run: gcloud auth login"
        exit 1
    fi
    echo -e "${GREEN}✅ Authenticated${NC}"
}

# Function to set project
set_project() {
    echo "Setting project to: $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    echo -e "${GREEN}✅ Project set${NC}"
}

# Function to apply quick fix (disable rate limiting)
apply_quick_fix() {
    echo -e "\n${YELLOW}Applying quick fix (disabling rate limiting)...${NC}"
    
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --update-env-vars="RATE_LIMIT_ENABLED=false,RISK_HOLDS_ENABLED=false" \
        --no-traffic
    
    echo -e "${GREEN}✅ Quick fix applied (rate limiting disabled)${NC}"
}

# Function to update configuration in Secret Manager
update_secret_config() {
    echo -e "\n${YELLOW}Updating configuration in Secret Manager...${NC}"
    
    # Check if secret exists
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &> /dev/null; then
        echo "Secret exists, adding new version..."
        gcloud secrets versions add $SECRET_NAME \
            --data-file=config.production.json \
            --project=$PROJECT_ID
    else
        echo "Creating new secret..."
        gcloud secrets create $SECRET_NAME \
            --data-file=config.production.json \
            --project=$PROJECT_ID
        
        # Grant Cloud Run access
        SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(spec.template.spec.serviceAccountName)")
        gcloud secrets add-iam-policy-binding $SECRET_NAME \
            --member="serviceAccount:$SERVICE_ACCOUNT" \
            --role="roles/secretmanager.secretAccessor" \
            --project=$PROJECT_ID
    fi
    
    echo -e "${GREEN}✅ Secret configuration updated${NC}"
}

# Function to deploy with full configuration
deploy_full_fix() {
    echo -e "\n${YELLOW}Deploying with full configuration...${NC}"
    
    # Re-enable rate limiting with proper config
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --update-env-vars="RATE_LIMIT_ENABLED=true,RISK_HOLDS_ENABLED=true,PRODUCT_SOT=firestore,RECONCILIATION_ENABLED=true,BACKFILL_ENABLED=true" \
        --project=$PROJECT_ID
    
    echo -e "${GREEN}✅ Full configuration deployed${NC}"
}

# Function to test endpoints
test_endpoints() {
    echo -e "\n${YELLOW}Testing production endpoints...${NC}"
    
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    # Test health endpoint
    echo "Testing health endpoint..."
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/health" || echo "000")
    
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Health endpoint OK${NC}"
    else
        echo -e "${RED}❌ Health endpoint returned: $HEALTH_STATUS${NC}"
    fi
    
    # Test wallet endpoint (will fail without auth, but should not be 500)
    echo "Testing wallet endpoint..."
    WALLET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/trpc/points.getWallet?input=%7B%22json%22%3A%7B%22uid%22%3A%22test%22%7D%7D" || echo "000")
    
    if [ "$WALLET_STATUS" != "500" ]; then
        echo -e "${GREEN}✅ Wallet endpoint not returning 500 (status: $WALLET_STATUS)${NC}"
    else
        echo -e "${RED}❌ Wallet endpoint still returning 500${NC}"
    fi
}

# Main execution
main() {
    echo "This script will fix the production 500 errors on siraj.life"
    echo ""
    
    # Pre-flight checks
    check_gcloud
    check_auth
    set_project
    
    # Check if config file exists
    if [ ! -f "config.production.json" ]; then
        echo -e "${RED}❌ config.production.json not found${NC}"
        echo "Please ensure you're running this from the project root"
        exit 1
    fi
    
    echo -e "\n${YELLOW}Choose deployment option:${NC}"
    echo "1) Quick fix only (disable rate limiting)"
    echo "2) Full fix (update configuration in Secret Manager)"
    echo "3) Both (recommended - quick fix first, then full fix)"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            apply_quick_fix
            ;;
        2)
            update_secret_config
            deploy_full_fix
            ;;
        3)
            apply_quick_fix
            update_secret_config
            deploy_full_fix
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    # Test the deployment
    echo -e "\n${YELLOW}Waiting 30 seconds for deployment to stabilize...${NC}"
    sleep 30
    test_endpoints
    
    echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
    echo "Please check https://siraj.life to verify the fix"
}

# Run main function
main
