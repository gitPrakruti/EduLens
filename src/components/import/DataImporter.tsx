import { FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DataRow } from "@/types/dataset";
import { matrixToTable, parsePastedTable } from "@/utils/parseTabular";

export type ImportResult = {
  name: string;
  source: "paste" | "file";
  headers: string[];
  rows: DataRow[];
};

const SAMPLE = `Name\tRoll No\tCGPA\tAttendance\tBacklogs\tBranch
Aarav Sharma\t101\t8.6\t92\t0\tCSE
Diya Nair\t102\t7.2\t74\t1\tCSE
Rohan Iyer\t103\t9.1\t88\t0\tECE`;

export function DataImporter({ onImported }: { onImported: (result: ImportResult) => void }) {
  const [pasted, setPasted] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const defaultName = () => name.trim() || `Student data — ${new Date().toLocaleDateString()}`;

  const handlePaste = () => {
    setError(null);
    try {
      const { headers, rows } = parsePastedTable(pasted);
      onImported({ name: defaultName(), source: "paste", headers, rows });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That data could not be read.");
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const isCsv = /\.csv$/i.test(file.name);
      if (isCsv) {
        const { headers, rows } = parsePastedTable(await file.text());
        onImported({ name: name.trim() || file.name.replace(/\.[^.]+$/, ""), source: "file", headers, rows });
        return;
      }

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("That workbook has no sheets.");
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName]!, {
        header: 1,
        blankrows: false,
        defval: null,
      });
      const { headers, rows } = matrixToTable(matrix);
      onImported({ name: name.trim() || file.name.replace(/\.[^.]+$/, ""), source: "file", headers, rows });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file could not be read.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import student data</CardTitle>
        <CardDescription>
          Paste straight from Excel or upload a spreadsheet. Columns are detected automatically — nothing
          needs to be set up in advance.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="dataset-name">Name this data (optional)</Label>
          <Input
            id="dataset-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Semester 5 — CSE internal marks"
          />
        </div>

        <Tabs defaultValue="paste">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste data</TabsTrigger>
            <TabsTrigger value="file">Upload file</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-3 pt-4">
            <Textarea
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              rows={10}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder={"Name\tRoll No\tCGPA\tAttendance\nAarav Sharma\t101\t8.6\t92"}
              aria-label="Pasted student data"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handlePaste} disabled={!pasted.trim()}>
                Read pasted data
              </Button>
              <Button variant="ghost" onClick={() => setPasted(SAMPLE)}>
                Use sample data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy the cells in Excel (including the header row) and paste them here.
            </p>
          </TabsContent>

          <TabsContent value="file" className="pt-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <FileSpreadsheet className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Drop an .xlsx, .xls or .csv file here</p>
              <p className="text-xs text-muted-foreground">The first sheet is used, with the first row as headers.</p>
              <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>
                <Upload className="size-4" aria-hidden />
                {busy ? "Reading file..." : "Choose a file"}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
