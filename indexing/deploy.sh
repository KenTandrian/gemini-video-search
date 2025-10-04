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

# --- Enable APIs ---
echo "Enabling required Google Cloud services..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com

# --- Build and Push Container Image ---
echo "Building and pushing the container image to Artifact Registry..."
(cd python && gcloud builds submit --region="$REGION" --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest" .)

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

# --- Create Cloud Run Job ---
echo "Creating Cloud Run job..."
gcloud run jobs update "$JOB_NAME" \
  --region="$REGION" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest" \
  --service-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --task-timeout=3600 # 1 hour timeout, adjust as needed

echo "--- Deployment Complete ---"
echo "To run the job, use the 'execute.sh' script."
