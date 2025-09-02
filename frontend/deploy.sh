#!/bin/bash

# Exit on error
set -e

# Get the project ID
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="gemini-video-search"
REGION="asia-southeast2"

# Deploy the application from source to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --allow-unauthenticated \
  --platform="managed" \
  --region="$REGION" \
  --source="."

echo "Deployment complete."
