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
# The name of the Artifact Registry repository to use
export REPOSITORY="${REPOSITORY:-cloud-run-source-deploy}"
# The name of the container image
export IMAGE_NAME="${IMAGE_NAME:-video-pipeline-processor}"
# The name of the Cloud Run job
export JOB_NAME="${JOB_NAME:-media-indexing-job}"
# The name of the service account for the job
export SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-media-indexing-sa}"

# --- Build and Push Container Image ---
echo "Building and pushing the container image to Artifact Registry..."
(cd python && gcloud builds submit --region="$REGION" --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest" .)

# --- Create Cloud Run Job ---
echo "Creating Cloud Run job..."
gcloud run jobs update "$JOB_NAME" \
  --region="$REGION" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest" \
  --service-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --task-timeout=3600 # 1 hour timeout, adjust as needed

echo "--- Deployment Complete ---"
echo "To run the job, use the 'execute.sh' script."
