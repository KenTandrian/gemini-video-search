# AI-Powered Semantic Video Search

This project is a proof-of-concept application demonstrating how to build a powerful, multilingual semantic search engine for video content using Google Cloud's Vertex AI Gemini and Vector Search capabilities.

The system ingests video files, uses a multimodal AI model to understand and describe the content in English, and then allows a user to search for specific moments in those videos using natural language queries in a different language (e.g., Indonesian).

_(Example: A user searches for "a dog catching a frisbee in a park" and the system finds the exact clip.)_

---

## The Power of Semantic Search

Traditional video search relies on manually-added tags, titles, and metadata. This is time-consuming and often fails to capture the nuance of the video's content. This project overcomes those limitations:

- **Goes Beyond Keywords:** Understands the _meaning and context_ of a user's query, not just keyword matching.
- **Deep Content Understanding:** Uses AI to automatically generate rich descriptions of what is happening within the video itself.
- **Seamless Multilingual Capability:** A user can search in their native language, and the system can find relevant content that was described in a completely different language.
- **Unlock Your Archive:** Makes vast video libraries instantly discoverable, down to the specific moment an action occurs.

## Features

- **AI-Powered Content Analysis:** Uses the Gemini 2.5 Pro model to generate detailed, contextual descriptions of video segments.
- **Multilingual Embeddings:** Leverages the `gemini-embedding-001` model to create numerical representations of text that capture semantic meaning across languages.
- **High-Speed Vector Search:** Utilizes Vertex AI Search for ultra-fast, scalable similarity search on millions of video segments.
- **Serverless API:** A scalable, cost-effective backend built with FastAPI and deployed on Cloud Run.
- **Simple Web Interface:** A clean frontend (React/Vue/Svelte) to demonstrate the search functionality.

## Architecture

The system is split into two main workflows: an offline **Indexing Pipeline** and a real-time **Search API**.

#### 1. Indexing Pipeline (Offline)

This process runs once for each new video to make its content searchable.

`Video File (GCS)  ->  Split into Segments  ->  Gemini 2.5 Pro (Describe in English)  ->  Gemini Embedding Model  ->  Store in Vertex AI Search`

#### 2. Search & Retrieval (Real-time)

This workflow is triggered by a user's search query.

`User Query (e.g., Indonesian)  ->  Frontend UI  ->  Backend API (Cloud Run)  ->  Gemini Embedding Model  ->  Query Vertex AI Search  ->  Return Video URL + Timestamp`

## Technology Stack

| Category         | Technology / Service                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| **DevOps**       | Docker, Google Cloud CLI (`gcloud`)                                                   |
| **Frontend**     | JavaScript, Next.js (React)                                                           |
| **Google Cloud** | Vertex AI (Gemini 2.5 Pro, Embedding API), Vertex AI Search, Cloud Storage, Cloud Run |
| **Indexing**     | Python, Google Cloud Python SDK, FFmpeg (for video segmentation)                      |

---

## Getting Started

Follow these steps to set up and run the project in your own Google Cloud environment.

### Prerequisites

- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/install) installed and authenticated.
- [Python 3.9+](https://www.python.org/downloads/) and `pip` installed.
- [Node.js and npm](https://nodejs.org/en/download/) installed.
- [Docker](https://www.docker.com/products/docker-desktop/) installed.

### 1. Google Cloud Project Setup

1.  **Create a Project:** Create a new Google Cloud project and ensure billing is enabled.
2.  **Enable APIs:** Enable the following APIs in your project:
    - Vertex AI API (`aiplatform.googleapis.com`)
    - Cloud Storage API (`storage.googleapis.com`)
    - Cloud Run API (`run.googleapis.com`)
3.  **Create Service Account:** Create a service account with the "Vertex AI User" and "Storage Admin" roles. Download the JSON key file and save it securely.
4.  **Create GCS Bucket:** Create a Google Cloud Storage bucket to store your video files.
5.  **Create Vertex AI Search Index:**
    - Go to the Vertex AI -> Search section in the Google Cloud Console.
    - Create a new Vector Search index.
    - Define the dimensions of your embedding (e.g., 768 for `gemini-embedding-001`).
    - Create a public endpoint for the index. Note the **Index ID** and **Index Endpoint ID**.

### 2. Configuration

1.  **Clone the Repository:**
    ```bash
    git clone <your-repo-url>
    cd gemini-video-search-demo
    ```
2.  **Set Environment Variables:**
    - Copy the example file: `cp .env.example .env`
    - Edit the `.env` file and fill in your specific Google Cloud project details.
    - Point `GOOGLE_APPLICATION_CREDENTIALS` to the path of your downloaded service account JSON key.

### 3. Run the Indexing Pipeline

This step processes a video and adds it to your search index.

1.  **Upload a video** to the GCS bucket you created.
2.  **Install dependencies:**
    ```bash
    cd indexing/
    pip install -r requirements.txt
    ```
3.  **Run the pipeline script:**
    ```bash
    python main_pipeline.py --video_path="gs://<your-bucket-name>/<your-video.mp4>"
    ```
    This may take some time depending on the length of the video.

### 4. Run the Frontend Application

The primary user interface is the Next.js application in the `frontend/` directory. It includes its own server-side logic to communicate with Google Cloud APIs and does not require a separate backend process.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend/
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:** Copy `frontend/.env.template` to `frontend/.env` and fill in your Google Cloud project details.
4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The web interface will be accessible at `http://localhost:3000`.

## Project Structure

```
.
├── frontend/             # Main Next.js full-stack application
├── indexing/             # Scripts for the video processing pipeline
├── yt-to-gcs-uploader/   # Utility to upload YouTube videos to GCS
├── frontend-flask/       # (Extras) Alternative implementation using Flask
├── frontend-simple/      # (Extras) Simple Vite frontend for related project
└── README.md             # This file
```

## Deployment

- **Frontend:** The Next.js application in `frontend/` can be deployed to **Cloud Run** or any Node.js hosting environment.
- **Indexing Pipeline:** The indexing scripts are designed to be run in a serverless environment like Cloud Run Jobs or manually as needed.
