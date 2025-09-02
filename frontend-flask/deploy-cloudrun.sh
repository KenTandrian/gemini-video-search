#!/bin/bash

# Gemini Video Search - Cloud Run Deployment Script
# Make sure you have gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID="lv-playground-genai"
SERVICE_NAME="gemini-video-search"
REGION="asia-southeast2"

echo "🚀 Deploying Gemini Video Search to Cloud Run"
echo "Project ID: ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "=================================="

# Set the active project
echo "📋 Setting active project..."
gcloud config set project ${PROJECT_ID}

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --source . \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --concurrency 80 \
    --timeout 300 \
    --set-env-vars "FLASK_ENV=production" \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --set-env-vars "VERTEX_AI_LOCATION=global" \
    --set-env-vars "VERTEX_AI_ENGINE_ID=emtek-media-search_1749661340727" \
    --set-env-vars "DEFAULT_PAGE_SIZE=10" \
    --port 8080

# Get the service URL
echo "✅ Deployment complete!"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo "🌐 Service URL: ${SERVICE_URL}"
echo ""
echo "📝 Test your deployment:"
echo "   Homepage: ${SERVICE_URL}"
echo "   Search: ${SERVICE_URL}/search?q=foto"
echo "   Health: ${SERVICE_URL}/health"
echo ""
echo "🎉 Emtek Video Search is now live on Cloud Run!" 