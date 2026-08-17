import { Link, createFileRoute } from "@tanstack/react-router";
import { Database, Filter, History, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { datasetService } from "@/services/datasetService";
import { historyService, savedFilterService } from "@/services/filterService";
import type { Dataset } from "@/types/dataset";
import type { HistoryEntry } from "@/types/filter";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — SmartFilter" },
      { name: "description", content: "Your datasets, saved filters and recent student analyses at a glance." },
      { property: "og:title", content: "Dashboard — SmartFilter" },
      { property: "og:description", content: "Manage and analyse your student datasets with ease." },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filterCount, setFilterCount] = useState(0);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setDatasets(datasetService.list());
    setFilterCount(savedFilterService.list().length);
    setEntries(historyService.list().slice(0, 5));
  }, []);

  const stats = [
    { label: "Total Datasets", value: datasets.length, icon: Database },
    { label: "Saved Filters", value: filterCount, icon: Filter },
    { label: "Recent Analyses", value: entries.length, icon: History },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">
            {greeting()}, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and analyze your student datasets with ease.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/filter">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filter students
            </Link>
          </Button>
          <Button asChild>
            <Link to="/import">
              <Plus className="size-4" aria-hidden />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold">Recent datasets</h2>
        {datasets.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Import a spreadsheet or paste from Excel to get started.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {datasets.slice(0, 5).map((dataset) => (
              <li key={dataset.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium">{dataset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataset.row_count} students · {dataset.columns.length} columns
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/filter" search={{ dataset: dataset.id }}>
                    Filter
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold">Recent analyses</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Your filter runs will appear here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm font-medium">
                  {entry.matched} of {entry.total} students · {entry.dataset_name}
                </p>
                <p className="text-xs text-muted-foreground">{entry.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
