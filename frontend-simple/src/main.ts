document
  .getElementById("search-button")!
  .addEventListener("click", function () {
    const query = (document.getElementById("search-input") as HTMLInputElement)
      .value;
    if (query) {
      searchMedia(query);
    }
  });

// Perform an initial search to display results on load
searchMedia("initial search");

interface Timestamp {
  start: number;
  end: number;
}

interface MediaResult {
  videoUrl: string;
  timestamps: Timestamp[];
}

function searchMedia(query: string) {
  console.log(`Searching for: ${query}`);
  // Mock API response
  const mockApiResponse: MediaResult[] = [
    {
      videoUrl:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      timestamps: [
        { start: 10, end: 15 },
        { start: 25, end: 30 },
        { start: 60, end: 65 },
      ],
    },
    {
      videoUrl:
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      timestamps: [
        { start: 30, end: 35 },
        { start: 60, end: 65 },
        { start: 90, end: 95 },
      ],
    },
  ];

  displayResults(mockApiResponse);
}

function displayResults(results: MediaResult[]) {
  const resultsContainer = document.getElementById("results-container")!;
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="text-center">No results found.</p>';
    return;
  }

  results.forEach((result) => {
    const videoResultDiv = document.createElement("div");
    videoResultDiv.className = "card mb-3";

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const videoPreview = document.createElement("video");
    videoPreview.className = "card-img-top";
    videoPreview.src = result.videoUrl;
    videoPreview.controls = true;
    videoPreview.preload = "metadata";
    videoResultDiv.appendChild(videoPreview);

    const videoTitle = document.createElement("h5");
    videoTitle.className = "card-title";
    videoTitle.textContent = result.videoUrl;
    cardBody.appendChild(videoTitle);

    const timestampsList = document.createElement("ul");
    timestampsList.className = "list-group list-group-flush";

    result.timestamps.forEach((timestamp) => {
      const timestampItem = document.createElement("li");
      timestampItem.className = "list-group-item";

      const timestampLink = document.createElement("a");
      timestampLink.className = "card-link";
      timestampLink.href = `${result.videoUrl}#t=${timestamp.start}`;
      timestampLink.textContent = `Timestamp: ${timestamp.start}s - ${timestamp.end}s`;
      timestampLink.target = "_blank"; // Open in new tab

      timestampItem.appendChild(timestampLink);
      timestampsList.appendChild(timestampItem);
    });

    cardBody.appendChild(timestampsList);
    videoResultDiv.appendChild(cardBody);
    resultsContainer.appendChild(videoResultDiv);
  });
}
