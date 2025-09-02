import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Video Discovery</CardTitle>
          <CardDescription>
            Search for videos using AI-powered discovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/search" method="GET">
            <div className="flex gap-4">
              <Input
                name="q"
                placeholder="Search for videos, shows, sports..."
                required
              />
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
