"use server";

import { SearchServiceClient } from "@google-cloud/discoveryengine";

// Get configuration from environment variables
const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
const location = process.env.VERTEX_AI_LOCATION!;
const engineId = process.env.VERTEX_AI_ENGINE_ID!;
const pageSize = parseInt(process.env.DEFAULT_PAGE_SIZE || "10", 10);

// Create client
const client = new SearchServiceClient({
  apiEndpoint: `${location}-discoveryengine.googleapis.com`,
});

function getPublicUrl(uri: string) {
  console.log(uri);
  if (!uri.startsWith("gs://")) {
    return uri;
  }
  return uri.replace("gs://", "https://storage.googleapis.com/");
}

export async function search(searchQuery: string) {
  const startTime = Date.now();
  if (!searchQuery) {
    return {
      groupedResults: {},
      summary: null,
      total_results: 0,
      duration: 0,
      error: "Query parameter required",
    };
  }

  const servingConfig = `projects/${projectId}/locations/${location}/collections/default_collection/engines/${engineId}/servingConfigs/default_config`;

  try {
    const [sResults, , response] = await client.search(
      {
        servingConfig,
        query: searchQuery,
        pageSize,
        contentSearchSpec: {
          snippetSpec: {
            returnSnippet: true,
          },
          summarySpec: {
            summaryResultCount: 5,
            includeCitations: true,
            ignoreAdversarialQuery: true,
            ignoreNonSummarySeekingQuery: true,
            modelPromptSpec: {
              preamble: "Provide a brief summary of the video content.",
            },
            modelSpec: {
              version: "stable",
            },
          },
        },
        queryExpansionSpec: {
          condition: "AUTO",
        },
        spellCorrectionSpec: {
          mode: "AUTO",
        },
      },
      {
        autoPaginate: false,
      }
    );

    const results =
      sResults.map((result) => {
        const structData = result.document?.structData?.fields;
        const derivedData = result.document?.derivedStructData?.fields;

        const title =
          structData?.video_title?.stringValue ||
          structData?.title?.stringValue ||
          structData?.name?.stringValue ||
          "Untitled Video";

        const uri =
          structData?.video_src?.stringValue ||
          structData?.uri?.stringValue ||
          structData?.url?.stringValue ||
          structData?.link?.stringValue ||
          "";

        let snippet =
          structData?.video_desc?.stringValue ||
          structData?.document_description?.stringValue ||
          structData?.description?.stringValue ||
          structData?.snippet?.stringValue ||
          structData?.document_transcript?.stringValue ||
          "";

        if (!snippet && derivedData?.snippets?.listValue?.values) {
          for (const snippetItem of derivedData.snippets.listValue.values) {
            const snippetText =
              snippetItem.structValue?.fields?.snippet?.stringValue;
            if (
              snippetText &&
              snippetText !== "No snippet is available for this page."
            ) {
              snippet = snippetText;
              break;
            }
          }
        }

        const titleMatch = title.match(/Segment from (.*) at (\d+)s/);
        const videoName = titleMatch ? titleMatch[1] : title;
        const timestamp = titleMatch ? parseInt(titleMatch[2], 10) : 0;
        const publicUri = getPublicUrl(uri);

        return {
          id: result.document?.id || "unknown",
          title,
          videoName,
          timestamp,
          uri: publicUri,
          snippet,
          thumbnail: "", // Placeholder for now
        };
      }) || [];

    // Group results by video name
    const groupedResults = results.reduce((acc, result) => {
      const key = result.videoName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    }, {} as Record<string, typeof results>);

    const duration = (Date.now() - startTime) / 1000;

    return {
      groupedResults,
      summary: response?.summary?.summaryText || null,
      total_results: response?.totalSize || 0,
      duration: duration.toFixed(2),
    };
  } catch (error) {
    console.error(`Search error: ${error}`);
    return {
      groupedResults: {},
      summary: null,
      total_results: 0,
      duration: 0,
      error: (error as Error).message,
    };
  }
}
