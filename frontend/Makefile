include .env.local

deploy:
	gcloud run deploy ${CLOUD_RUN_SERVICE} --project ${GOOGLE_CLOUD_PROJECT} --region asia-southeast1 --source .
