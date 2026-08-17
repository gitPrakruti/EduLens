import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataImporter, type ImportResult } from "@/components/import/DataImporter";
import { DataPreview } from "@/components/import/DataPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createDatasetId, datasetService } from "@/services/datasetService";
import type { Dataset } from "@/types/dataset";
import { buildColumns } from "@/utils/dataTypeDetection";

export const Route = createFileRoute("/_authenticated/import")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Import Student Data — SmartFilter" },
      {
        name: "description",
        content: "Paste from Excel or upload a spreadsheet — SmartFilter detects every column for you.",
      },
      { property: "og:title", content: "Import Student Data — SmartFilter" },
      { property: "og:description", content: "Bring student data into SmartFilter in seconds." },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const navigate = useNavigate();
  const [imported, setImported] = useState<ImportResult | null>(null);

  const columns = useMemo(
    () => (imported ? buildColumns(imported.rows, imported.headers) : []),
    [imported],
  );

  const confirm = () => {
    if (!imported) return;
    const dataset: Dataset = {
      id: createDatasetId(),
      name: imported.name,
      source: imported.source,
      created_at: new Date().toISOString(),
      columns,
      rows: imported.rows,
      row_count: imported.rows.length,
    };
    datasetService.save(dataset);
    datasetService.setActiveId(dataset.id);
    toast.success(`${dataset.row_count} students imported.`);
    void navigate({ to: "/datasets" });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Import student data</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Step {imported ? 2 : 1} of 2 — {imported ? "check the preview, then save" : "paste or upload your data"}.
        </p>
      </header>

      {!imported && <DataImporter onImported={setImported} />}

      {imported && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" aria-hidden />
                {imported.name}
              </CardTitle>
              <CardDescription>
                {imported.rows.length} students · {columns.length} columns detected
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImported(null)}>
                <ArrowLeft className="size-4" aria-hidden />
                Start over
              </Button>
              <Button onClick={confirm}>Save dataset</Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataPreview columns={columns} rows={imported.rows} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
