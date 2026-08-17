export type ColumnType = "number" | "text" | "date" | "boolean" | "empty";

export type ColumnMeta = {
  key: string;
  label: string;
  type: ColumnType;
  filled: number;
  missing: number;
  unique: number;
  sample: string[];
  min?: number;
  max?: number;
};

export type DataRow = Record<string, string | number | boolean | null>;

export type Dataset = {
  id: string;
  name: string;
  source: "paste" | "file";
  created_at: string;
  columns: ColumnMeta[];
  rows: DataRow[];
  row_count: number;
};
