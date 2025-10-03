#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

# These should match the values in your deploy.sh script
# They will use environment variables if set, otherwise they will use the default values.
export PROJECT_ID="${PROJECT_ID:-your-project-id}"
export REGION="${REGION:-asia-southeast1}"
export JOB_NAME="${JOB_NAME:-media-indexing-job}"

# --- Video URIs ---
# Add your video URIs to this list
VIDEO_URIS=(
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 1 dan 2 - Gara Gara Bantuan Aluna, Galaxy Malah Dapat Sial.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 3 - Cinta Segitiga! Aluna & Felicia Sama-Sama Naksir Ezra.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 3 - Salting Abis!! Galaxy Puji Aluna Cantik.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 4 dan 5 - BAPER!!! Galaxy Tenangkan Aluna Yang Bersedih.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 4 dan 5 - Ihiy! Galaxy Ngarep Pacaran Sama Aluna.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 6 - ADUH!! Aluna Mulai Curiga Kalau Axy Bukan Tukang Kuda.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 6 - Ngakak! Ezra Ketahuan Lagi Fotoin Feli.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 7 dan 8 - Aluna Pergoki Pak Omar Selingkuh.mp4"
  # "gs://vertex-gemini-video-search/videos/Cinta Sedalam Rindu Episode 7 dan 8 - Razia! Aluna Pastikan Kalau Axy Tukang Kuda.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Bali United FC VS PSM Makassar _ Pekan 13.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Madura United FC VS Semen Padang FC _ Pekan 14.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Malut United FC vs Dewa United FC _ Pekan 13.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ PS Barito Putera VS PSBS Biak _ Pekan 13.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ PSS Sleman VS PERSIB Bandung _ Pekan 13.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Persebaya Surabaya VS Arema FC _ Pekan 13.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Persebaya Surabaya VS Persik Kediri _ Pekan 14.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Persija Jakarta VS Borneo FC Samarinda _ Pekan 14.mp4"
  # "gs://vertex-gemini-video-search/videos/Highlight _ Persita Tangerang VS Persis Solo _ Pekan 13.mp4"
)

# --- Execute Cloud Run Job for each video ---
for VIDEO_URI in "${VIDEO_URIS[@]}"; do
  echo "Executing Cloud Run job '$JOB_NAME' for video: $VIDEO_URI"
  gcloud run jobs execute "$JOB_NAME" \
    --args="--video_uri=${VIDEO_URI}" \
    --region="$REGION"
  echo "--- Job execution for $VIDEO_URI complete ---"
done

echo "--- All Job Executions Complete ---"
