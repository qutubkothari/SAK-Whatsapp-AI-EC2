#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check for errors in logs
check_for_errors() {
    local minutes=$1
    echo -e "${YELLOW}Checking logs for the last $minutes minutes...${NC}"
    
    # Get logs and look for errors
    ERROR_COUNT=$(gcloud app logs read "timestamp >= '-${minutes}m'" --format='table(time,severity,message)' | grep -c "ERROR\|Exception\|CRITICAL")
    
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${RED}Found $ERROR_COUNT errors in the last $minutes minutes${NC}"
        echo -e "${YELLOW}Error details:${NC}"
        gcloud app logs read "timestamp >= '-${minutes}m'" --format='table(time,severity,message)' | grep -B 1 -A 2 "ERROR\|Exception\|CRITICAL"
    else
        echo -e "${GREEN}No errors found in the last $minutes minutes${NC}"
    fi
}

# Get service status
echo -e "${YELLOW}Checking App Engine service status...${NC}"
gcloud app describe

# Check recent logs
check_for_errors 5

# Stream new logs
echo -e "\n${YELLOW}Streaming new logs (Press Ctrl+C to stop)...${NC}"
gcloud app logs tail -s default