import { Link, createFileRoute } from "@tanstack/react-router";
import { History as HistoryIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { historyService } from "@/services/filterService";
import type { HistoryEntry } from "@/types/filter";

export const Route = createFileRoute("/_authenticated/history")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Analysis History — SmartFilter" },
      { name: "description", content: "Every filter you have run, with how many students matched." },
      { property: "og:title", content: "Analysis History — SmartFilter" },
      { property: "og:description", content: "Revisit your past student analyses." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => historyService.list());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Analysis history</h1>
          <p className="mt-2 text-sm text-muted-foreground">{entries.length} recent analyses</p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              historyService.clear();
              setEntries([]);
              toast.success("History cleared.");
            }}
          >
            Clear history
          </Button>
        )}
      </header>

      {entries.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <HistoryIcon className="size-5 text-secondary-foreground" aria-hidden />
            </div>
            <CardTitle>Nothing here yet</CardTitle>
            <CardDescription>Run a filter and it will show up in your history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/filter">Filter students</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {entry.matched} of {entry.total} students · {entry.dataset_name}
                  </CardTitle>
                  <CardDescription className="break-words">
                    {entry.summary} · {new Date(entry.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/filter" search={{ dataset: entry.dataset_id }}>
                      Open dataset
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label="Delete history entry"
                    onClick={() => {
                      historyService.remove(entry.id);
                      setEntries(historyService.list());
                    }}
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
