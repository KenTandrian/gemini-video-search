import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { search } from "@/lib/search";
import type { Route } from "next";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const query = (await searchParams).q as string;
  const searchResults = await search(query);

  return (
    <div>
      <div className="mb-4">
        <form>
          <div className="flex gap-4">
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search for videos, shows, sports..."
              required
            />
            <Button type="submit">Search</Button>
          </div>
        </form>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        {searchResults.total_results > 0 && (
          <p>
            About {searchResults.total_results} result
            {searchResults.total_results !== 1 ? "s" : ""} (
            {searchResults.duration} seconds)
          </p>
        )}
      </div>

      {searchResults.error && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{searchResults.error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {searchResults.summary && (
        <Card className="w-full mb-4">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{searchResults.summary}</p>
          </CardContent>
        </Card>
      )}

      {Object.keys(searchResults.groupedResults).length === 0 &&
        !searchResults.error && (
          <Card className="w-full text-center">
            <CardHeader>
              <CardTitle>No results found</CardTitle>
              <CardDescription>
                Your search - <strong>{query}</strong> - did not match any
                videos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Suggestions:</p>
              <ul className="list-disc list-inside text-left mx-auto max-w-md mt-2">
                <li>Make sure all words are spelled correctly.</li>
                <li>Try different keywords.</li>
                <li>Try more general keywords.</li>
                <li>Try fewer keywords.</li>
              </ul>
              <Button asChild className="mt-4">
                <Link href="/">New Search</Link>
              </Button>
            </CardContent>
          </Card>
        )}

      <div className="space-y-4">
        {Object.entries(searchResults.groupedResults).map(
          ([videoName, segments]) => (
            <Card key={videoName} className="w-full">
              <CardHeader>
                <CardTitle>{videoName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {segments
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((segment) => (
                    <div key={segment.id} className="border-t pt-2">
                      <p className="font-semibold">
                        Timestamp: {segment.timestamp}s
                      </p>
                      <p>{segment.snippet}</p>
                      <Link
                        href={segment.uri as Route}
                        target="_blank"
                        className="text-blue-500 hover:underline"
                      >
                        Watch segment
                      </Link>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
