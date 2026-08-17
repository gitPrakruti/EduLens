import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Filter as FilterIcon, Play, RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FilterBuilder, createRule } from "@/components/filter/FilterBuilder";
import { ResultsTable } from "@/components/filter/ResultsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { datasetService } from "@/services/datasetService";
import { createId, historyService, savedFilterService } from "@/services/filterService";
import type { DataRow } from "@/types/dataset";
import type { FilterGroup } from "@/types/filter";
import { applyFilters, describeGroup } from "@/utils/filterEngine";

type Search = { dataset?: string | undefined; filter?: string | undefined };

export const Route = createFileRoute("/_authenticated/filter")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search => ({
    dataset: typeof search["dataset"] === "string" ? search["dataset"] : undefined,
    filter: typeof search["filter"] === "string" ? search["filter"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Filter Students — SmartFilter" },
      {
        name: "description",
        content: "Build AND/OR rules on any column and get the exact list of students you need.",
      },
      { property: "og:title", content: "Filter Students — SmartFilter" },
      { property: "og:description", content: "Column, condition, value — filter students instantly." },
    ],
  }),
  component: FilterPage,
});

function FilterPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const datasets = useMemo(() => datasetService.list(), []);
  const savedFilter = search.filter ? savedFilterService.list().find((f) => f.id === search.filter) : undefined;

  const initialId =
    savedFilter?.dataset_id ?? search.dataset ?? datasetService.getActiveId() ?? datasets[0]?.id ?? "";

  const [datasetId, setDatasetId] = useState(initialId);
  const dataset = useMemo(() => (datasetId ? datasetService.get(datasetId) : null), [datasetId]);

  const [group, setGroup] = useState<FilterGroup>(() =>
    savedFilter ? savedFilter.group : { combinator: "AND", rules: [] },
  );
  const [results, setResults] = useState<DataRow[] | null>(null);
  const [filterName, setFilterName] = useState(savedFilter?.name ?? "");

  const columns = dataset?.columns ?? [];
  if (dataset && group.rules.length === 0) {
    setGroup({ ...group, rules: [createRule(dataset.columns)] });
  }

  const summary = describeGroup(group, columns);

  const run = () => {
    if (!dataset) return;
    const matched = applyFilters(dataset.rows, group);
    setResults(matched);
    historyService.add({
      id: createId("hist"),
      dataset_id: dataset.id,
      dataset_name: dataset.name,
      group,
      summary,
      matched: matched.length,
      total: dataset.rows.length,
      created_at: new Date().toISOString(),
    });
    toast.success(`${matched.length} of ${dataset.rows.length} students matched.`);
  };

  const saveFilter = () => {
    if (!dataset) return;
    const name = filterName.trim();
    if (!name) {
      toast.error("Give this filter a name first.");
      return;
    }
    savedFilterService.save({
      id: createId("flt"),
      name,
      dataset_id: dataset.id,
      dataset_name: dataset.name,
      group,
      created_at: new Date().toISOString(),
    });
    toast.success(`Filter "${name}" saved.`);
  };

  if (datasets.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <FilterIcon className="size-5 text-secondary-foreground" aria-hidden />
            </div>
            <CardTitle>Import data to start filtering</CardTitle>
            <CardDescription>You need at least one dataset before building rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/import">Import data</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Filter students</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a column, choose a condition, enter a value — add as many rules as you need.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose a dataset</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={datasetId}
            onValueChange={(value) => {
              setDatasetId(value);
              datasetService.setActiveId(value);
              const next = datasetService.get(value);
              setGroup({ combinator: "AND", rules: next ? [createRule(next.columns)] : [] });
              setResults(null);
              void navigate({ to: "/filter", search: { dataset: value }, replace: true });
            }}
          >
            <SelectTrigger className="max-w-md" aria-label="Dataset">
              <SelectValue placeholder="Select a dataset" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.row_count} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {dataset && (
        <Card>
          <CardHeader>
            <CardTitle>2. Build your rules</CardTitle>
            <CardDescription>{summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FilterBuilder columns={columns} group={group} onChange={setGroup} />

            <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
              <Button onClick={run}>
                <Play className="size-4" aria-hidden />
                Apply filter
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setGroup({ combinator: "AND", rules: [createRule(columns)] });
                  setResults(null);
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </Button>
              <div className="ml-auto flex items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="filter-name" className="text-xs text-muted-foreground">
                    Save this filter as
                  </Label>
                  <Input
                    id="filter-name"
                    value={filterName}
                    placeholder="e.g. Backlog students"
                    className="w-56"
                    onChange={(event) => setFilterName(event.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={saveFilter}>
                  <Save className="size-4" aria-hidden />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {dataset && results && (
        <Card>
          <CardHeader>
            <CardTitle>
              3. Results — {results.length} of {dataset.rows.length} students
            </CardTitle>
            <CardDescription>{summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResultsTable columns={columns} rows={results} filename={`${dataset.name}-filtered`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
