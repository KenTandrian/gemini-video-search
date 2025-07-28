import os
import shutil
from dotenv import load_dotenv
from google.cloud import storage
import yt_dlp

# Load environment variables from .env file
load_dotenv()

# Get configuration from environment variables
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "downloads")
YOUTUBE_PLAYLIST_ID = os.getenv("YOUTUBE_PLAYLIST_ID")
NUM_VIDEOS = int(os.getenv("NUM_VIDEOS", 5))


def upload_and_cleanup(filepath, bucket_name):
    """
    Uploads a file to GCS and then deletes it locally.
    """
    if not os.path.isfile(filepath):
        print(f"File not found: {filepath}, skipping.")
        return

    new_filename = f"Emtek - {os.path.basename(filepath)}"
    print(f"\nUploading {os.path.basename(filepath)} as {new_filename} to GCS bucket {bucket_name}...")
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(new_filename)
    
    try:
        blob.upload_from_filename(filepath)
        print(f"Successfully uploaded {new_filename}.")
    except Exception as e:
        print(f"Error uploading {new_filename}: {e}")
        return # Don't delete if upload failed

    # Cleanup local file
    try:
        os.remove(filepath)
        print(f"Successfully removed local file: {os.path.basename(filepath)}.")
    except OSError as e:
        print(f"Error removing local file {os.path.basename(filepath)}: {e}")

def download_and_process_videos(playlist_url, num_videos, download_path, bucket_name):
    """
    Downloads a specific number of videos from a playlist,
    uploading each to GCS and then deleting locally.
    """
    print(f"\nStarting download and upload process for playlist {playlist_url}...")

    def post_download_hook(d):
        if d['status'] == 'finished':
            filepath = d['filename']
            print(f"Finished downloading: {os.path.basename(filepath)}")
            upload_and_cleanup(filepath, bucket_name)

    ydl_opts = {
        'outtmpl': os.path.join(download_path, '%(title)s.%(ext)s'),
        'format': 'best',
        'ignoreerrors': True,
        'playlist_items': f'1-{num_videos}',
        'progress_hooks': [post_download_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([playlist_url])
    
    print("\nFinished processing all videos.")

def main():
    """
    Main function to download YouTube videos and upload them to GCS.
    """
    print("Starting the YouTube to GCS script...")

    if not YOUTUBE_PLAYLIST_ID or YOUTUBE_PLAYLIST_ID == "YOUR_PLAYLIST_ID_HERE":
        print("Error: YOUTUBE_PLAYLIST_ID is not set in the .env file.")
        return

    # Create download directory if it doesn't exist
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    playlist_url = f"https://www.youtube.com/playlist?list={YOUTUBE_PLAYLIST_ID}"

    print(f"Playlist URL: {playlist_url}")
    print(f"Number of videos: {NUM_VIDEOS}")
    print(f"GCS Bucket Name: {GCS_BUCKET_NAME}")
    print(f"Download Directory: {DOWNLOAD_DIR}")

    download_and_process_videos(playlist_url, NUM_VIDEOS, DOWNLOAD_DIR, GCS_BUCKET_NAME)

    # Final cleanup of the download directory in case it's not empty
    if os.path.exists(DOWNLOAD_DIR) and not os.listdir(DOWNLOAD_DIR):
        shutil.rmtree(DOWNLOAD_DIR)
        print(f"Successfully removed empty download directory: {DOWNLOAD_DIR}")


if __name__ == "__main__":
    main()
