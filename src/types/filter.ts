import type { ColumnType } from "@/types/dataset";

export type Operator =
  | "eq"
  | "neq"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "before"
  | "after"
  | "on"
  | "is_true"
  | "is_false"
  | "is_empty"
  | "is_not_empty"
  | "in";

export type Combinator = "AND" | "OR";

export type FilterRule = {
  id: string;
  column: string;
  operator: Operator;
  value: string;
  value2: string;
};

export type FilterGroup = {
  combinator: Combinator;
  rules: FilterRule[];
};

export type SavedFilter = {
  id: string;
  name: string;
  dataset_id: string;
  dataset_name: string;
  group: FilterGroup;
  created_at: string;
};

export type HistoryEntry = {
  id: string;
  dataset_id: string;
  dataset_name: string;
  group: FilterGroup;
  summary: string;
  matched: number;
  total: number;
  created_at: string;
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "is equal to",
  neq: "is not equal to",
  contains: "contains",
  not_contains: "does not contain",
  starts_with: "starts with",
  ends_with: "ends with",
  gt: "is greater than",
  gte: "is greater than or equal to",
  lt: "is less than",
  lte: "is less than or equal to",
  between: "is between",
  before: "is before",
  after: "is after",
  on: "is on",
  is_true: "is Yes",
  is_false: "is No",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  in: "is one of",
};

export const OPERATORS_BY_TYPE: Record<ColumnType, Operator[]> = {
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "is_not_empty"],
  text: [
    "eq",
    "neq",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "in",
    "is_empty",
    "is_not_empty",
  ],
  date: ["on", "before", "after", "between", "is_empty", "is_not_empty"],
  boolean: ["is_true", "is_false", "is_empty", "is_not_empty"],
  empty: ["is_empty", "is_not_empty"],
};

/** Operators that need no value input at all. */
export const NO_VALUE_OPERATORS: Operator[] = ["is_true", "is_false", "is_empty", "is_not_empty"];
