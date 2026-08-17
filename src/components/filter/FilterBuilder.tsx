import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMeta } from "@/types/dataset";
import {
  NO_VALUE_OPERATORS,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
  type Combinator,
  type FilterGroup,
  type FilterRule,
  type Operator,
} from "@/types/filter";
import { createId } from "@/services/filterService";

export function createRule(columns: ColumnMeta[]): FilterRule {
  const column = columns[0];
  return {
    id: createId("rule"),
    column: column?.key ?? "",
    operator: column ? (OPERATORS_BY_TYPE[column.type][0] ?? "eq") : "eq",
    value: "",
    value2: "",
  };
}

export function FilterBuilder({
  columns,
  group,
  onChange,
}: {
  columns: ColumnMeta[];
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
}) {
  const update = (id: string, patch: Partial<FilterRule>) =>
    onChange({
      ...group,
      rules: group.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    });

  const columnType = (key: string) => columns.find((column) => column.key === key)?.type ?? "text";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm text-muted-foreground">Match</Label>
        <Select
          value={group.combinator}
          onValueChange={(value) => onChange({ ...group, combinator: value as Combinator })}
        >
          <SelectTrigger className="w-44" aria-label="Match type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">All rules (AND)</SelectItem>
            <SelectItem value="OR">Any rule (OR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {group.rules.map((rule, index) => {
          const type = columnType(rule.column);
          const operators = OPERATORS_BY_TYPE[type];
          const needsValue = !NO_VALUE_OPERATORS.includes(rule.operator);
          const inputType = type === "number" ? "number" : type === "date" ? "date" : "text";

          return (
            <div
              key={rule.id}
              className="rounded-lg border border-border bg-card p-3 md:flex md:items-end md:gap-3"
            >
              <span className="mb-2 block w-16 text-xs font-medium uppercase tracking-wide text-muted-foreground md:mb-2.5">
                {index === 0 ? "Where" : group.combinator}
              </span>

              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Column</Label>
                  <Select
                    value={rule.column}
                    onValueChange={(value) => {
                      const nextType = columnType(value);
                      update(rule.id, {
                        column: value,
                        operator: OPERATORS_BY_TYPE[nextType][0] ?? "eq",
                        value: "",
                        value2: "",
                      });
                    }}
                  >
                    <SelectTrigger aria-label="Column">
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column.key} value={column.key}>
                          {column.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Condition</Label>
                  <Select
                    value={rule.operator}
                    onValueChange={(value) =>
                      update(rule.id, { operator: value as Operator, value: "", value2: "" })
                    }
                  >
                    <SelectTrigger aria-label="Condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((operator) => (
                        <SelectItem key={operator} value={operator}>
                          {OPERATOR_LABELS[operator]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsValue && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {rule.operator === "between" ? "From" : "Value"}
                    </Label>
                    <Input
                      type={inputType}
                      value={rule.value}
                      aria-label="Value"
                      placeholder={rule.operator === "in" ? "e.g. CSE, ECE" : "Enter value"}
                      onChange={(event) => update(rule.id, { value: event.target.value })}
                    />
                  </div>
                )}

                {needsValue && rule.operator === "between" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type={inputType}
                      value={rule.value2}
                      aria-label="Second value"
                      onChange={(event) => update(rule.id, { value2: event.target.value })}
                    />
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="mt-3 md:mt-0"
                aria-label="Remove rule"
                disabled={group.rules.length === 1}
                onClick={() =>
                  onChange({ ...group, rules: group.rules.filter((item) => item.id !== rule.id) })
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        onClick={() => onChange({ ...group, rules: [...group.rules, createRule(columns)] })}
      >
        <Plus className="size-4" aria-hidden />
        Add rule
      </Button>
    </div>
  );
}
