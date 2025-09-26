import type { ApiResponse, Video } from "./types";

document
  .getElementById("search-button")!
  .addEventListener("click", function () {
    const query = (document.getElementById("search-input") as HTMLInputElement)
      .value;
    if (query) {
      searchMedia(query);
    }
  });

async function searchMedia(query: string) {
  const resultsContainer = document.getElementById("results-container")!;
  resultsContainer.innerHTML = `
    <div class="d-flex justify-content-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    displayResults(data.entries);
  } catch (error) {
    console.error("Error fetching search results:", error);
    resultsContainer.innerHTML = `<div class="alert alert-danger" role="alert">
      Failed to fetch search results. Please try again later.
    </div>`;
  }
}

function displayResults(results: Video[]) {
  const resultsContainer = document.getElementById("results-container")!;
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="text-center">No results found.</p>';
    return;
  }

  results.forEach((result) => {
    const videoResultDiv = document.createElement("div");
    videoResultDiv.className = "card mb-3";

    const videoPreview = document.createElement("video");
    videoPreview.className = "card-img-top";
    const videoFileName = result.video_file.replace(/_/g, " ");
    const gcsBucketUrl = import.meta.env.VITE_GCS_BUCKET_URL;

    const timestampParts = result.timestamp.split(":");
    const seconds =
      parseInt(timestampParts[0], 10) * 60 + parseInt(timestampParts[1], 10);
    videoPreview.src = `${gcsBucketUrl}/${encodeURIComponent(
      videoFileName
    )}#t=${seconds}`;
    videoPreview.controls = true;
    videoPreview.preload = "metadata";
    videoResultDiv.appendChild(videoPreview);

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const description = document.createElement("p");
    description.className = "card-text";
    description.textContent = result.description;
    cardBody.appendChild(description);

    const timestampLink = document.createElement("a");
    timestampLink.className = "card-link";
    timestampLink.href = `${videoPreview.src}#t=${seconds}`;
    timestampLink.textContent = `Go to timestamp: ${result.timestamp}`;
    timestampLink.target = "_blank";

    cardBody.appendChild(timestampLink);
    videoResultDiv.appendChild(cardBody);
    resultsContainer.appendChild(videoResultDiv);
  });
}
