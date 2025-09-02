"use server";

import type { Facet, Segment } from "@/types/search";
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
  if (!uri.startsWith("gs://")) return uri;
  return uri.replace("gs://", "https://storage.googleapis.com/");
}

export async function search(
  query: string,
  facetFilters: Record<string, string[]> = {}
) {
  const startTime = Date.now();
  if (!query) {
    return {
      duration: 0,
      error: "Query parameter required",
      groupedResults: {},
      summary: null,
      total_results: 0,
      facets: [] as Facet[],
    };
  }

  const servingConfig = `projects/${projectId}/locations/${location}/collections/default_collection/engines/${engineId}/servingConfigs/default_config`;

  try {
    const [sResults, , response] = await client.search(
      {
        pageSize,
        query,
        servingConfig,
        filter: Object.entries(facetFilters)
          .map(([key, values]) =>
            values.map((value) => `${key}: ANY("${value}")`).join(" AND ")
          )
          .join(" AND "),
        facetSpecs: [
          { facetKey: { key: "persons.name" }, limit: 20 },
          { facetKey: { key: "organizations.name" }, limit: 20 },
          { facetKey: { key: "hash_tags" }, limit: 50 },
        ],
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
        relevanceScoreSpec: {
          returnRelevanceScore: true,
        },
        spellCorrectionSpec: {
          mode: "AUTO",
        },
        userInfo: {
          timeZone: "Asia/Jakarta",
        },
      },
      {
        autoPaginate: false,
      }
    );

    const results: Segment[] =
      sResults.map((result) => {
        const structData = result.document?.structData?.fields;

        const snippet =
          structData?.title?.stringValue || "No video description";

        const uri =
          structData?.video_src?.stringValue ||
          structData?.uri?.stringValue ||
          structData?.url?.stringValue ||
          structData?.link?.stringValue ||
          "";

        const title = structData?.description?.stringValue || "Untitled Video";
        const titleMatch = title.match(/Segment from (.*) at ([\d.]+)s/);
        const videoName = titleMatch ? titleMatch[1] : title;
        const timestamp = titleMatch ? parseInt(titleMatch[2], 10) : 0;
        const publicUri = getPublicUrl(uri);
        const duration = structData?.duration?.stringValue || "0s";

        const persons: Segment["persons"] =
          structData?.persons?.listValue?.values?.map(
            (p) => p.structValue?.fields?.name?.stringValue ?? ""
          ) || [];
        const organizations: Segment["organizations"] =
          structData?.organizations?.listValue?.values?.map(
            (o) => o.structValue?.fields?.name?.stringValue ?? ""
          ) || [];
        const hash_tags: Segment["hash_tags"] =
          structData?.hash_tags?.listValue?.values?.map(
            (t) => t.stringValue ?? ""
          ) || [];

        return {
          duration,
          hash_tags,
          organizations,
          persons,
          snippet,
          timestamp,
          title,
          videoName,
          id: result.document?.id || "unknown",
          uri: publicUri,
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
    }, {} as Record<string, Segment[]>);

    const duration = (Date.now() - startTime) / 1000;

    return {
      groupedResults,
      summary: response?.summary?.summaryText || null,
      total_results: response?.totalSize || 0,
      duration: duration.toFixed(2),
      facets:
        response?.facets?.map((facet) => ({
          key: facet.key ?? "",
          values:
            facet.values?.map((value) => ({
              value: value.value ?? "",
              count: Number(value.count) ?? 0,
            })) || [],
        })) || [],
    };
  } catch (error) {
    console.error(`Search error: ${error}`);
    return {
      groupedResults: {},
      summary: null,
      total_results: 0,
      duration: 0,
      error: (error as Error).message,
      facets: [] as Facet[],
    };
  }
}
