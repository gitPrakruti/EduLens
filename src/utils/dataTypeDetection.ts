import type { ColumnMeta, ColumnType, DataRow } from "@/types/dataset";

const BOOLEAN_TRUE = new Set(["yes", "true", "y", "present", "pass"]);
const BOOLEAN_FALSE = new Set(["no", "false", "n", "absent", "fail"]);

const DATE_PATTERNS = [
  /^\d{4}-\d{1,2}-\d{1,2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
  /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/,
];

export function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (isBlank(value)) return null;
  const cleaned = String(value).trim().replace(/,/g, "").replace(/%$/, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (isBlank(value)) return null;
  const text = String(value).trim().toLowerCase();
  if (BOOLEAN_TRUE.has(text)) return true;
  if (BOOLEAN_FALSE.has(text)) return false;
  return null;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (isBlank(value)) return null;
  const text = String(value).trim();
  if (!DATE_PATTERNS.some((pattern) => pattern.test(text))) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Detects the column type from the values actually present (blanks ignored). */
export function detectColumnType(values: unknown[]): ColumnType {
  const present = values.filter((value) => !isBlank(value));
  if (present.length === 0) return "empty";

  const ratio = (fn: (value: unknown) => unknown) =>
    present.filter((value) => fn(value) !== null).length / present.length;

  // Word-based yes/no only; 1/0 stays numeric so counts keep number filters.
  const booleanRatio = present.filter((value) => toBoolean(value) !== null).length / present.length;
  const uniqueValues = new Set(present.map((value) => String(value).trim().toLowerCase()));
  if (booleanRatio >= 0.95 && uniqueValues.size <= 2) return "boolean";

  if (ratio(toNumber) >= 0.9) return "number";
  if (ratio(toDate) >= 0.9) return "date";
  return "text";
}

export function buildColumnMeta(key: string, rows: DataRow[]): ColumnMeta {
  const values = rows.map((row) => row[key]);
  const present = values.filter((value) => !isBlank(value));
  const type = detectColumnType(values);

  const meta: ColumnMeta = {
    key,
    label: key,
    type,
    filled: present.length,
    missing: values.length - present.length,
    unique: new Set(present.map((value) => String(value).trim())).size,
    sample: Array.from(new Set(present.map((value) => String(value).trim()))).slice(0, 4),
  };

  if (type === "number") {
    const numbers = present.map(toNumber).filter((value): value is number => value !== null);
    if (numbers.length > 0) {
      meta.min = Math.min(...numbers);
      meta.max = Math.max(...numbers);
    }
  }

  return meta;
}

export function buildColumns(rows: DataRow[], keys: string[]): ColumnMeta[] {
  return keys.map((key) => buildColumnMeta(key, rows));
}
