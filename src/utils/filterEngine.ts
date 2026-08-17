import type { ColumnMeta, DataRow } from "@/types/dataset";
import {
  NO_VALUE_OPERATORS,
  OPERATOR_LABELS,
  type FilterGroup,
  type FilterRule,
} from "@/types/filter";
import { isBlank, toBoolean, toDate, toNumber } from "@/utils/dataTypeDetection";

/** A rule is usable only when it has a column and (if needed) a value. */
export function isRuleComplete(rule: FilterRule): boolean {
  if (!rule.column) return false;
  if (NO_VALUE_OPERATORS.includes(rule.operator)) return true;
  if (rule.operator === "between") return rule.value.trim() !== "" && rule.value2.trim() !== "";
  return rule.value.trim() !== "";
}

function text(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function evaluateRule(row: DataRow, rule: FilterRule): boolean {
  const raw = row[rule.column];
  const target = rule.value.trim();

  switch (rule.operator) {
    case "is_empty":
      return isBlank(raw);
    case "is_not_empty":
      return !isBlank(raw);
    case "is_true":
      return toBoolean(raw) === true;
    case "is_false":
      return toBoolean(raw) === false;
    default:
      break;
  }

  if (isBlank(raw)) return false;

  const numberValue = toNumber(raw);
  const numberTarget = toNumber(target);
  const numeric = numberValue !== null && numberTarget !== null;

  switch (rule.operator) {
    case "eq":
      return numeric ? numberValue === numberTarget : text(raw) === text(target);
    case "neq":
      return numeric ? numberValue !== numberTarget : text(raw) !== text(target);
    case "contains":
      return text(raw).includes(text(target));
    case "not_contains":
      return !text(raw).includes(text(target));
    case "starts_with":
      return text(raw).startsWith(text(target));
    case "ends_with":
      return text(raw).endsWith(text(target));
    case "in":
      return target
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
        .includes(text(raw));
    case "gt":
      return numeric && numberValue > numberTarget;
    case "gte":
      return numeric && numberValue >= numberTarget;
    case "lt":
      return numeric && numberValue < numberTarget;
    case "lte":
      return numeric && numberValue <= numberTarget;
    case "between": {
      const second = toNumber(rule.value2);
      if (numeric && second !== null) {
        const low = Math.min(numberTarget, second);
        const high = Math.max(numberTarget, second);
        return numberValue >= low && numberValue <= high;
      }
      const dateValue = toDate(raw);
      const from = toDate(target);
      const to = toDate(rule.value2);
      if (dateValue && from && to) {
        const low = Math.min(from.getTime(), to.getTime());
        const high = Math.max(from.getTime(), to.getTime());
        return dateValue.getTime() >= low && dateValue.getTime() <= high;
      }
      return false;
    }
    case "before": {
      const dateValue = toDate(raw);
      const other = toDate(target);
      return !!dateValue && !!other && dateValue.getTime() < other.getTime();
    }
    case "after": {
      const dateValue = toDate(raw);
      const other = toDate(target);
      return !!dateValue && !!other && dateValue.getTime() > other.getTime();
    }
    case "on": {
      const dateValue = toDate(raw);
      const other = toDate(target);
      return (
        !!dateValue && !!other && dateValue.toDateString() === other.toDateString()
      );
    }
    default:
      return false;
  }
}

export function applyFilters(rows: DataRow[], group: FilterGroup): DataRow[] {
  const active = group.rules.filter(isRuleComplete);
  if (active.length === 0) return rows;

  return rows.filter((row) => {
    const results = active.map((rule) => evaluateRule(row, rule));
    return group.combinator === "AND" ? results.every(Boolean) : results.some(Boolean);
  });
}

/** Plain-English description a teacher can read back, e.g. "Marks is greater than 40 AND ...". */
export function describeGroup(group: FilterGroup, columns: ColumnMeta[]): string {
  const label = (key: string) => columns.find((column) => column.key === key)?.label ?? key;
  const parts = group.rules.filter(isRuleComplete).map((rule) => {
    const base = `${label(rule.column)} ${OPERATOR_LABELS[rule.operator]}`;
    if (NO_VALUE_OPERATORS.includes(rule.operator)) return base;
    if (rule.operator === "between") return `${base} ${rule.value} and ${rule.value2}`;
    return `${base} ${rule.value}`;
  });
  return parts.length === 0 ? "All students" : parts.join(` ${group.combinator} `);
}

export function toCsv(columns: ColumnMeta[], rows: DataRow[]): string {
  const escape = (value: unknown) => {
    const cell = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  };
  const header = columns.map((column) => escape(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column.key])).join(","));
  return [header, ...body].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
