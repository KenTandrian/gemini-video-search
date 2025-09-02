import { FacetFilter } from "@/components/facet-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VideoPlayer } from "@/components/video-player";
import { search } from "@/lib/search";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const query = sp.q as string;
  const facetFilters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (key !== "q") {
      if (!facetFilters[key]) {
        facetFilters[key] = [];
      }
      facetFilters[key].push(value as string);
    }
  }
  const searchResults = await search(query, facetFilters);

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="col-span-1">
        <FacetFilter facets={searchResults.facets} />
      </div>
      <div className="col-span-3">
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
              <VideoPlayer
                key={videoName}
                videoName={videoName}
                segments={segments}
              />
            )
          )}
        </div>
        <div className="space-y-4">
          {Object.entries(searchResults.groupedResults).map(
            ([videoName, segments]) => (
              <VideoPlayer
                key={videoName}
                videoName={videoName}
                segments={segments}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
