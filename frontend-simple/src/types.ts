export interface Video {
  video_file: string;
  text_file: string;
  description: string;
  timestamp: string; // format "MM:SS"
}

export interface ApiResponse {
  status: string;
  query: string;
  entries: Video[];
}
