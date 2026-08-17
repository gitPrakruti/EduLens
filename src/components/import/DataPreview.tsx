import { CalendarDays, Hash, ToggleLeft, Type } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColumnMeta, ColumnType, DataRow } from "@/types/dataset";

const TYPE_META: Record<ColumnType, { label: string; icon: typeof Hash }> = {
  number: { label: "Number", icon: Hash },
  text: { label: "Text", icon: Type },
  date: { label: "Date", icon: CalendarDays },
  boolean: { label: "Yes / No", icon: ToggleLeft },
  empty: { label: "Empty", icon: Type },
};

export function ColumnTypeBadge({ type }: { type: ColumnType }) {
  const { label, icon: Icon } = TYPE_META[type];
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

export function DataPreview({
  columns,
  rows,
  limit = 10,
}: {
  columns: ColumnMeta[];
  rows: DataRow[];
  limit?: number;
}) {
  const preview = rows.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.key} className="rounded-lg border border-border bg-card p-3">
            <p className="truncate text-sm font-medium" title={column.label}>
              {column.label}
            </p>
            <div className="mt-2">
              <ColumnTypeBadge type={column.type} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {column.filled} filled
              {column.missing > 0 ? ` · ${column.missing} blank` : ""} · {column.unique} unique
              {column.type === "number" && column.min !== undefined
                ? ` · ${column.min}–${column.max}`
                : ""}
            </p>
          </div>
        ))}
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
            {preview.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
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

      {rows.length > preview.length && (
        <p className="text-xs text-muted-foreground">
          Showing the first {preview.length} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
