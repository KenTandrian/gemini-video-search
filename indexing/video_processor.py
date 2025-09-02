import os
import tempfile
import logging
from google.cloud import storage
import ffmpeg

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_video_from_gcs(
    gcs_bucket_name: str,
    gcs_video_path: str,
    segment_duration: int,
    processed_segments_gcs_path: str,
) -> list[tuple[str, float]]:
    """
    Downloads a video from GCS, splits it into segments, and uploads them back.

    Returns:
        A list of tuples, where each tuple contains the GCS URI and the
        duration of the newly created video segments.
    """
    storage_client = storage.Client()
    bucket = storage_client.bucket(gcs_bucket_name)
    source_blob = bucket.blob(gcs_video_path)
    video_filename = os.path.basename(gcs_video_path)

    processed_segments = []

    with tempfile.TemporaryDirectory() as temp_dir:
        local_video_path = os.path.join(temp_dir, video_filename)
        logger.info(f"Downloading video gs://{gcs_bucket_name}/{gcs_video_path} to {local_video_path}...")
        source_blob.download_to_filename(local_video_path)
        logger.info("Download complete.")

        output_template = os.path.join(temp_dir, f"{os.path.splitext(video_filename)[0]}_%04d.mp4")
        logger.info(f"Splitting video into {segment_duration}-second segments...")
        
        try:
            (
                ffmpeg
                .input(local_video_path)
                .output(output_template, f='segment', segment_time=segment_duration, reset_timestamps=1, c='copy')
                .run(capture_stdout=True, capture_stderr=True, quiet=True)
            )
            logger.info("Video splitting complete.")
        except ffmpeg.Error as e:
            logger.error("ffmpeg error:")
            logger.error(e.stderr.decode('utf8'))
            raise

        # Upload segments to GCS
        for filename in sorted(os.listdir(temp_dir)):
            if filename.endswith(".mp4") and filename != video_filename:
                local_segment_path = os.path.join(temp_dir, filename)
                
                # Get the duration of the segment
                try:
                    probe = ffmpeg.probe(local_segment_path)
                    duration = float(probe['format']['duration'])
                except ffmpeg.Error as e:
                    logger.error(f"Failed to get duration for {local_segment_path}: {e.stderr.decode('utf8')}")
                    duration = segment_duration # Fallback to the default segment duration

                segment_blob_name = f"{processed_segments_gcs_path}/{filename}"
                
                logger.info(f"Uploading segment {local_segment_path} to gs://{gcs_bucket_name}/{segment_blob_name}...")
                blob = bucket.blob(segment_blob_name)
                blob.upload_from_filename(local_segment_path)
                
                gcs_uri = f"gs://{gcs_bucket_name}/{segment_blob_name}"
                processed_segments.append((gcs_uri, duration))
    
    logger.info(f"Successfully processed video into {len(processed_segments)} segments.")
    return processed_segments
