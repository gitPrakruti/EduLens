"""Python mirror of src/utils/filterEngine.ts so both sides filter identically."""

from datetime import datetime
from typing import Any

from app.schemas.filter import FilterGroup, FilterRule
from app.services.type_detection import is_blank, to_boolean, to_date, to_number

OPERATOR_LABELS = {
    "eq": "is equal to",
    "neq": "is not equal to",
    "contains": "contains",
    "not_contains": "does not contain",
    "starts_with": "starts with",
    "ends_with": "ends with",
    "gt": "is greater than",
    "gte": "is greater than or equal to",
    "lt": "is less than",
    "lte": "is less than or equal to",
    "between": "is between",
    "before": "is before",
    "after": "is after",
    "on": "is on",
    "is_true": "is Yes",
    "is_false": "is No",
    "is_empty": "is empty",
    "is_not_empty": "is not empty",
    "in": "is one of",
}

NO_VALUE_OPERATORS = {"is_true", "is_false", "is_empty", "is_not_empty"}


def _text(value: Any) -> str:
    return ("" if value is None else str(value)).strip().lower()


def is_rule_complete(rule: FilterRule) -> bool:
    if not rule.column:
        return False
    if rule.operator in NO_VALUE_OPERATORS:
        return True
    if rule.operator == "between":
        return bool(rule.value.strip()) and bool(rule.value2.strip())
    return bool(rule.value.strip())


def evaluate_rule(row: dict[str, Any], rule: FilterRule) -> bool:
    raw = row.get(rule.column)
    target = rule.value.strip()

    if rule.operator == "is_empty":
        return is_blank(raw)
    if rule.operator == "is_not_empty":
        return not is_blank(raw)
    if rule.operator == "is_true":
        return to_boolean(raw) is True
    if rule.operator == "is_false":
        return to_boolean(raw) is False

    if is_blank(raw):
        return False

    number_value = to_number(raw)
    number_target = to_number(target)
    numeric = number_value is not None and number_target is not None

    if rule.operator == "eq":
        return number_value == number_target if numeric else _text(raw) == _text(target)
    if rule.operator == "neq":
        return number_value != number_target if numeric else _text(raw) != _text(target)
    if rule.operator == "contains":
        return _text(target) in _text(raw)
    if rule.operator == "not_contains":
        return _text(target) not in _text(raw)
    if rule.operator == "starts_with":
        return _text(raw).startswith(_text(target))
    if rule.operator == "ends_with":
        return _text(raw).endswith(_text(target))
    if rule.operator == "in":
        options = [part.strip().lower() for part in target.split(",") if part.strip()]
        return _text(raw) in options
    if rule.operator == "gt":
        return numeric and number_value > number_target
    if rule.operator == "gte":
        return numeric and number_value >= number_target
    if rule.operator == "lt":
        return numeric and number_value < number_target
    if rule.operator == "lte":
        return numeric and number_value <= number_target
    if rule.operator == "between":
        second = to_number(rule.value2)
        if numeric and second is not None:
            low, high = sorted([number_target, second])
            return low <= number_value <= high
        date_value, start, end = to_date(raw), to_date(target), to_date(rule.value2)
        if date_value and start and end:
            low_date, high_date = sorted([start, end])
            return low_date <= date_value <= high_date
        return False
    if rule.operator in {"before", "after", "on"}:
        date_value = to_date(raw)
        other = to_date(target)
        if not date_value or not other:
            return False
        if rule.operator == "before":
            return date_value < other
        if rule.operator == "after":
            return date_value > other
        return date_value.date() == other.date()
    return False


def apply_filters(rows: list[dict[str, Any]], group: FilterGroup) -> list[dict[str, Any]]:
    active = [rule for rule in group.rules if is_rule_complete(rule)]
    if not active:
        return rows
    combine = all if group.combinator == "AND" else any
    return [row for row in rows if combine(evaluate_rule(row, rule) for rule in active)]


def describe_group(group: FilterGroup) -> str:
    parts: list[str] = []
    for rule in group.rules:
        if not is_rule_complete(rule):
            continue
        base = f"{rule.column} {OPERATOR_LABELS[rule.operator]}"
        if rule.operator in NO_VALUE_OPERATORS:
            parts.append(base)
        elif rule.operator == "between":
            parts.append(f"{base} {rule.value} and {rule.value2}")
        else:
            parts.append(f"{base} {rule.value}")
    return f" {group.combinator} ".join(parts) if parts else "All students"


def utc_now() -> datetime:
    from datetime import timezone

    return datetime.now(timezone.utc)
