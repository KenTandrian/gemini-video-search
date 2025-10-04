#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Replace with your Google Cloud project ID
export PROJECT_ID="${PROJECT_ID:-your-project-id}"
# Replace with your desired GCP region
export REGION="${REGION:-asia-southeast1}"
# The name of the service account for the job
export SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-media-indexing-sa}"

# --- Enable APIs ---
echo "Enabling required Google Cloud services..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com

# --- Create Service Account ---
echo "Creating service account..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
  --display-name="Service Account for Video Indexing Job" || echo "Service account '$SERVICE_ACCOUNT_NAME' already exists."

# --- Grant Permissions to Service Account ---
echo "Granting necessary permissions to the service account..."
# Permission to access GCS buckets
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
# Permission to invoke Vertex AI models
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
# Permission to manage Vertex AI Search data
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.editor"

echo "--- Infrastructure Setup Complete ---"
