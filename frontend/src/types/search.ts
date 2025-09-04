export type Facet = {
  key: string;
  values: {
    value: string;
    count: number;
  }[];
};

export interface SearchResult {
  groupedResults: Record<string, Segment[]>;
  summary: string | null;
  total_results: number;
  duration: string;
  facets: {
    key: string;
    values: {
      value: string;
      count: number;
    }[];
  }[];
  error?: string;
}

export type Segment = {
  duration: string;
  hash_tags: string[];
  id: string;
  metadata: {
    relevanceScore?: number;
  };
  organizations: string[];
  persons: string[];
  snippet: string;
  timestamp: number;
  title: string;
  uri: string;
  videoName: string;
};
