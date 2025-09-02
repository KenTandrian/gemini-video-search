"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Segment } from "@/types/search";
import { useEffect, useRef, useState } from "react";

type VideoPlayerProps = {
  videoName: string;
  segments: Segment[];
};

export function VideoPlayer({ videoName, segments }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);
  const [mainVideoDuration, setMainVideoDuration] = useState(0);

  useEffect(() => {
    function fetchDuration() {
      const mainVideoUrl = `https://storage.googleapis.com/vertex-gemini-video-search/videos/${videoName}`;
      const mainVideo = document.createElement("video");
      mainVideo.src = mainVideoUrl;
      mainVideo.onloadedmetadata = () => {
        setMainVideoDuration(mainVideo.duration);
      };
    }
    fetchDuration();
  }, [videoName]);

  function handleSegmentClick(segment: Segment) {
    if (videoRef.current) {
      videoRef.current.src = segment.uri;
      videoRef.current.currentTime = 0; // Segments are clips, so start from 0
      videoRef.current.play();
      setCurrentSegment(segment);
    }
  }

  // Use the URI of the first segment as the initial source for the player
  const initialVideoUri = segments[0]?.uri;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{videoName}</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <div>
          <video
            ref={videoRef}
            controls
            className="w-full rounded-lg"
            src={initialVideoUri}
            // Load metadata to get duration, but don't preload the whole video
            preload="metadata"
          />
          {mainVideoDuration > 0 && (
            <div className="relative w-full h-3 bg-gray-200 rounded-sm mt-2 overflow-hidden">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="absolute h-3 bg-blue-500 opacity-75 hover:opacity-100 rounded-sm cursor-pointer"
                  style={{
                    left: `${(segment.timestamp / mainVideoDuration) * 100}%`,
                    width: `${
                      (parseFloat(segment.duration) / mainVideoDuration) * 100
                    }%`,
                  }}
                  title={`Segment at ${segment.timestamp}s`}
                  onClick={() => handleSegmentClick(segment)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {segments
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((segment) => (
              <div
                key={segment.id}
                className={`p-2 rounded-lg cursor-pointer ${
                  currentSegment?.id === segment.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => handleSegmentClick(segment)}
              >
                <p className="font-semibold">
                  Timestamp: {segment.timestamp}s (Duration: {segment.duration})
                </p>
                <p>{segment.snippet}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {segment.persons.map((person) => (
                    <span
                      key={person}
                      className="bg-blue-200 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full"
                    >
                      {person}
                    </span>
                  ))}
                  {segment.organizations.map((org) => (
                    <span
                      key={org}
                      className="bg-green-200 text-green-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full"
                    >
                      {org}
                    </span>
                  ))}
                  {segment.hash_tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-200 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
