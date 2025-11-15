#!/bin/bash

<<<<<<< HEAD
# Quick Deploy Script for Google App Engine
# Usage: ./deploy.sh

echo "Starting deployment to Google App Engine..."

# Generate version name with timestamp
timestamp=$(date +"%Y%m%d-%H%M%S")
version="auto-deploy-$timestamp"

echo "Version: $version"

# Deploy to Google Cloud with quiet flag (no confirmation)
gcloud app deploy --version=$version --quiet

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    echo "URL: https://sak-whatsapp-ai-sales-assist.wl.r.appspot.com"
    echo "Checking deployment status..."

    # Quick status check (not endless loop)
    gcloud app versions list --filter="version.id=$version" --format="table(version.id,status,traffic_split)"

    echo "Deployment complete. You can check logs with:"
    echo "gcloud app logs read --limit=20"
else
    echo "Deployment failed!"
    exit 1
fi
=======
# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print current time
echo -e "${GREEN}Starting App Engine deployment at $(date)${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
for tool in gcloud git; do
    if ! command_exists "$tool"; then
        echo -e "${RED}Error: $tool is not installed${NC}"
        exit 1
    fi
done

# Clean up old versions
echo -e "${YELLOW}Cleaning up old versions...${NC}"
# List versions, excluding the current traffic-serving version
SERVING_VERSION=$(gcloud app versions list --sort-by='~version' --filter="TRAFFIC_SPLIT>0" --format="value(version.id)")
echo -e "${GREEN}Current serving version: $SERVING_VERSION${NC}"

# Get list of old versions to delete (keep last 10 plus serving version)
VERSIONS_TO_DELETE=$(gcloud app versions list --sort-by='~version' \
    --filter="version.id!=$SERVING_VERSION" \
    --format="value(version.id)" | tail -n +10)

if [ ! -z "$VERSIONS_TO_DELETE" ]; then
    echo -e "${YELLOW}Deleting old versions: ${NC}"
    echo "$VERSIONS_TO_DELETE"
    echo "$VERSIONS_TO_DELETE" | xargs gcloud app versions delete --quiet
else
    echo -e "${GREEN}No old versions to delete${NC}"
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes...${NC}"
git add .
git commit -m "fix: Auto-deployment $(date '+%Y-%m-%d %H:%M:%S')"
git pull origin main

# Deploy to App Engine
echo -e "${YELLOW}Deploying to App Engine...${NC}"
gcloud app deploy app.yaml --quiet

# Check deployment status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

# Get the deployed version
VERSION=$(gcloud app versions list --sort-by '~version' --limit=1 --format='value(version.id)')
echo -e "${GREEN}Deployed version: $VERSION${NC}"

# Start log streaming in the background
echo -e "${YELLOW}Starting log streaming...${NC}"
gcloud app logs tail -s default --project=$(gcloud config get-value project) &
LOG_PID=$!

# Function to cleanup background processes
cleanup() {
    kill $LOG_PID 2>/dev/null
    echo -e "\n${YELLOW}Log streaming stopped${NC}"
}

# Register cleanup function
trap cleanup EXIT

echo -e "${GREEN}Deployment completed at $(date)${NC}"
echo -e "${YELLOW}Streaming logs... (Press Ctrl+C to stop)${NC}"

# Wait for user interrupt
wait $LOG_PID
>>>>>>> 2829115fb1348bcedc54ce1f3f288e1bb560fd66
