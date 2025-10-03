import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(".env")

# --- GCP Project Configuration ---
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-project-id")
# The region for your Data Store (e.g., "global" or "us")
REGION = "global"
GCS_BUCKET = os.getenv("GCS_BUCKET", "your-gcs-bucket")

# --- Vertex AI Configuration ---
# The Multimodal model for video analysis.
GEMINI_MODEL_NAME = "gemini-2.5-pro"

# --- Vertex AI Search (Discovery Engine) Configuration ---
DATA_STORE_ID = os.getenv("GCP_DATA_STORE_ID", "your-datastore-id")

# --- Video Processing Configuration ---
VIDEO_SEGMENT_DURATION = 15

# --- GCS Folder Configuration ---
# The folder inside GCS_BUCKET where your source videos are located.
VIDEO_INPUT_FOLDER = "videos"
# The folder for processed 15-second video segments.
PROCESSED_SEGMENTS_GCS_PATH = "processed-segments"
# The folder for the final JSONL data to be imported.
JSONL_GCS_PATH = "discovery-engine-data"