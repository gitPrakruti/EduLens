import { Download, SearchX } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColumnMeta, DataRow } from "@/types/dataset";
import { downloadCsv, toCsv } from "@/utils/filterEngine";

const PAGE_SIZE = 25;

export function ResultsTable({
  columns,
  rows,
  filename,
}: {
  columns: ColumnMeta[];
  rows: DataRow[];
  filename: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const term = search.trim().toLowerCase();
  const visible = term
    ? rows.filter((row) =>
        columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(term)),
      )
    : rows;

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const slice = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <SearchX className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">No students match these rules</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try relaxing a condition or switching to &quot;Any rule&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={search}
          aria-label="Search results"
          placeholder="Search results..."
          className="max-w-xs"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
        <Button variant="outline" onClick={() => downloadCsv(filename, toCsv(columns, visible))}>
          <Download className="size-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              {columns.map((column) => (
                <TableHead key={column.key} className="whitespace-nowrap">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">
                  {current * PAGE_SIZE + index + 1}
                </TableCell>
                {columns.map((column) => {
                  const value = row[column.key];
                  return (
                    <TableCell key={column.key} className="whitespace-nowrap">
                      {value === null || value === undefined || value === "" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        String(value)
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Showing {slice.length} of {visible.length} students
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <span>
              Page {current + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
