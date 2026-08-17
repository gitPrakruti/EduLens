import { Link, createFileRoute } from "@tanstack/react-router";
import { Filter, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { savedFilterService } from "@/services/filterService";
import type { SavedFilter } from "@/types/filter";
import { describeGroup } from "@/utils/filterEngine";

export const Route = createFileRoute("/_authenticated/saved-filters")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Saved Filters — SmartFilter" },
      { name: "description", content: "Reuse the student filters you built earlier in one click." },
      { property: "og:title", content: "Saved Filters — SmartFilter" },
      { property: "og:description", content: "Your reusable student filter presets." },
    ],
  }),
  component: SavedFiltersPage,
});

function SavedFiltersPage() {
  const [filters, setFilters] = useState<SavedFilter[]>(() => savedFilterService.list());

  const remove = (filter: SavedFilter) => {
    savedFilterService.remove(filter.id);
    setFilters(savedFilterService.list());
    toast.success(`"${filter.name}" deleted.`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Saved filters</h1>
          <p className="mt-2 text-sm text-muted-foreground">{filters.length} saved</p>
        </div>
        <Button asChild>
          <Link to="/filter">New filter</Link>
        </Button>
      </header>

      {filters.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <Filter className="size-5 text-secondary-foreground" aria-hidden />
            </div>
            <CardTitle>No saved filters yet</CardTitle>
            <CardDescription>Save a filter from the filter page to reuse it later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/filter">Build a filter</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <Card key={filter.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle>{filter.name}</CardTitle>
                  <CardDescription className="break-words">
                    {filter.dataset_name} · {describeGroup(filter.group, [])}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/filter" search={{ filter: filter.id }}>
                      <Play className="size-4" aria-hidden />
                      Run
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Delete ${filter.name}`}
                    onClick={() => remove(filter)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
