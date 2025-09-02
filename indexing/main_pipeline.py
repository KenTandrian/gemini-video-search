import os
import json
import uuid
import argparse
import tempfile
from tqdm import tqdm
from google.cloud import storage
from datetime import datetime, timezone

# Import our pipeline modules
import config
import video_processor
import gemini_analyzer
import discovery_engine_indexer

def run_pipeline(gcs_video_uri: str):
    """
    Orchestrates the indexing pipeline for a single video, creating documents
    that conform to the specific data store schema.
    """
    print(f"--- Starting Pipeline for: {gcs_video_uri} ---")

    # 1. Process the video into segments
    print(f"[Step 1/3] Processing video...")
    if not gcs_video_uri.startswith("gs://"):
        raise ValueError("Invalid GCS URI. Must start with 'gs://'")
    bucket_name, *blob_parts = gcs_video_uri[5:].split('/')
    video_blob_path = "/".join(blob_parts)
    
    segment_gcs_uris = video_processor.process_video_from_gcs(
        gcs_bucket_name=bucket_name,
        gcs_video_path=video_blob_path,
        segment_duration=15,
        processed_segments_gcs_path=config.PROCESSED_SEGMENTS_GCS_PATH,
    )

    # 2. Analyze segments and prepare the final JSON data
    print(f"[Step 2/3] Analyzing {len(segment_gcs_uris)} segments with Gemini...")
    video_documents = []
    video_basename = os.path.basename(video_blob_path)

    for i, seg_uri in enumerate(tqdm(segment_gcs_uris, desc="Analyzing segments")):
        description = gemini_analyzer.generate_video_description(seg_uri)
        if description:
            start_time = i * 15

            schema_compliant_data = {
                # --- Required fields ---
                "title": f"Segment from {video_basename} at {start_time}s",
                "categories": ["Sports", "Soccer", "Video Highlight"],
                "uri": seg_uri,
                "available_time": datetime.now(timezone.utc).isoformat(),

                # --- Optional but important fields ---
                "description": description,
                "duration": "15s", # ISO 8601 duration format for 15 seconds
                "in_languages": ["en"], # Assuming English descriptions
            }

            simple_json_data = {
                "id": str(uuid.uuid4()),
                "struct_data": schema_compliant_data
            }
            video_documents.append(simple_json_data)

    # 3. Upload the JSONL file and trigger the import job
    print(f"[Step 3/3] Uploading {len(video_documents)} documents and triggering import...")
    if not video_documents:
        print("No documents were generated for this video. Skipping import.")
        return

    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix=".jsonl") as tmpfile:
        for doc in video_documents:
            tmpfile.write(json.dumps(doc) + '\n')
        tmpfile_path = tmpfile.name
    
    jsonl_filename = f"{video_basename}_{uuid.uuid4()}.jsonl"
    jsonl_blob_name = f"{config.JSONL_GCS_PATH}/{jsonl_filename}"
    
    storage_client = storage.Client()
    bucket = storage_client.bucket(config.GCS_BUCKET)
    blob = bucket.blob(jsonl_blob_name)
    
    print(f"Uploading data to gs://{config.GCS_BUCKET}/{jsonl_blob_name}")
    blob.upload_from_filename(tmpfile_path)
    os.remove(tmpfile_path)

    jsonl_gcs_uri_for_import = f"gs://{config.GCS_BUCKET}/{jsonl_blob_name}"
    discovery_engine_indexer.import_documents_from_gcs(jsonl_gcs_uri_for_import)
    
    print(f"\n--- Successfully submitted pipeline for: {gcs_video_uri} ---")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run the video indexing pipeline for a single video.")
    parser.add_argument(
        "--video_uri",
        required=True,
        help="The GCS URI of the single video to process (e.g., gs://my-bucket/videos/match.mp4)",
    )
    args = parser.parse_args()
    run_pipeline(args.video_uri)
