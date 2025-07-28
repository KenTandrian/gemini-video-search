# YouTube to Google Cloud Storage Uploader

This script downloads a specified number of videos from a YouTube playlist and uploads them to a Google Cloud Storage bucket. It processes videos one by one to minimize local disk usage.

## Prerequisites

- Python 3.9+
- A Google Cloud Platform project with the Storage API enabled.
- `gcloud` CLI installed and authenticated.

## Setup

1.  **Clone the repository or download the files.**

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
    ```

3.  **Install the required dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Google Cloud Authentication:**

    You need to authenticate your environment so the script can access your GCS bucket. The easiest way is to use the `gcloud` CLI:

    ```bash
    gcloud auth application-default login
    ```

    This command will open a browser window for you to log in to your Google account and authorize access.

5.  **Configure the Environment:**

    Copy the template file to a new `.env` file:
    ```bash
    cp .env.template .env
    ```
    
    Then, open the `.env` file and set the following variables. The template file provides examples.

    - `YOUTUBE_PLAYLIST_ID`: The ID of the YouTube playlist you want to download from.
    - `NUM_VIDEOS`: The number of videos to download from the beginning of the playlist.
    - `GCS_BUCKET_NAME`: The name of your Google Cloud Storage bucket.
    - `GCS_FILENAME_PREFIX`: (Optional) A prefix to add to the filename of each video uploaded to GCS.
    - `DOWNLOAD_DIR`: The local directory where videos will be temporarily stored.

## Usage

Once the setup is complete, you can run the script with the following command:

```bash
python main.py
```

The script will:
1.  Read the configuration from the `.env` file.
2.  Create the download directory if it doesn't exist.
3.  For each of the first `NUM_VIDEOS` in the playlist:
    a. Download the video to the local `downloads` directory.
    b. Upload the video to your GCS bucket, adding the specified prefix to the filename.
    c. Delete the video from the local `downloads` directory.
4.  Once all videos are processed, it will remove the now-empty `downloads` directory.
