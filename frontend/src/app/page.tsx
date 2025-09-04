"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SUGGESTED_PROMPTS = [
  "missed shot",
  "amazing goal",
  "great save",
  "yellow card",
  "red card",
  "free kick",
  "penalty kick",
  "corner kick",
];

export default function Home() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="justify-center">
          <CardTitle className="text-3xl text-center">
            Video Discovery
          </CardTitle>
          <CardDescription className="text-lg text-center">
            Search for videos using AI-powered discovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/search" method="GET">
            <div className="flex gap-2">
              <Input
                name="q"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for videos, shows, sports..."
                required
                value={query}
              />
              <Button className="cursor-pointer" type="submit">
                Search
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap gap-2 mt-8 justify-center">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Button
                className="rounded-full"
                size="sm"
                key={prompt}
                onClick={() => setQuery(prompt)}
                variant="outline"
              >
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
