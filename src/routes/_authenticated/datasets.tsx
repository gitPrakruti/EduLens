import { Link, createFileRoute } from "@tanstack/react-router";
import { Database, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataPreview } from "@/components/import/DataPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { datasetService } from "@/services/datasetService";
import type { Dataset } from "@/types/dataset";

export const Route = createFileRoute("/_authenticated/datasets")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Datasets — SmartFilter" },
      { name: "description", content: "Every student dataset you have imported into SmartFilter." },
      { property: "og:title", content: "My Datasets — SmartFilter" },
      { property: "og:description", content: "Review and manage your imported student datasets." },
    ],
  }),
  component: DatasetsPage,
});

function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>(() => datasetService.list());
  const [openId, setOpenId] = useState<string | null>(() => datasetService.getActiveId());

  const remove = (dataset: Dataset) => {
    datasetService.remove(dataset.id);
    setDatasets(datasetService.list());
    if (openId === dataset.id) setOpenId(null);
    toast.success(`"${dataset.name}" deleted.`);
  };

  if (datasets.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
              <Database className="size-5 text-secondary-foreground" aria-hidden />
            </div>
            <CardTitle>No datasets yet</CardTitle>
            <CardDescription>Import student data to start filtering.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/import">
                <Plus className="size-4" aria-hidden />
                Import data
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">My datasets</h1>
          <p className="mt-2 text-sm text-muted-foreground">{datasets.length} saved</p>
        </div>
        <Button asChild>
          <Link to="/import">
            <Plus className="size-4" aria-hidden />
            New import
          </Link>
        </Button>
      </header>

      <div className="space-y-4">
        {datasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{dataset.name}</CardTitle>
                <CardDescription>
                  {dataset.row_count} students · {dataset.columns.length} columns ·{" "}
                  {new Date(dataset.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = openId === dataset.id ? null : dataset.id;
                    setOpenId(next);
                    if (next) datasetService.setActiveId(next);
                  }}
                >
                  {openId === dataset.id ? "Hide preview" : "Preview"}
                </Button>
                <Button variant="ghost" aria-label={`Delete ${dataset.name}`} onClick={() => remove(dataset)}>
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </CardHeader>
            {openId === dataset.id && (
              <CardContent>
                <DataPreview columns={dataset.columns} rows={dataset.rows} />
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
