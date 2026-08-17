"""Column type inference used when a spreadsheet is parsed server-side.

Mirrors src/utils/dataTypeDetection.ts so client and server agree on types.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

TRUE_VALUES = {"yes", "true", "y", "present", "pass"}
FALSE_VALUES = {"no", "false", "n", "absent", "fail"}

DATE_PATTERNS = [
    re.compile(r"^\d{4}-\d{1,2}-\d{1,2}$"),
    re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}$"),
    re.compile(r"^\d{1,2}-\d{1,2}-\d{2,4}$"),
]
DATE_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%d/%m/%y"]


def is_blank(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def to_number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if is_blank(value):
        return None
    cleaned = str(value).strip().replace(",", "").rstrip("%")
    try:
        return float(cleaned)
    except ValueError:
        return None


def to_boolean(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if is_blank(value):
        return None
    text = str(value).strip().lower()
    if text in TRUE_VALUES:
        return True
    if text in FALSE_VALUES:
        return False
    return None


def to_date(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if is_blank(value):
        return None
    text = str(value).strip()
    if not any(pattern.match(text) for pattern in DATE_PATTERNS):
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def detect_column_type(values: list[Any]) -> str:
    present = [value for value in values if not is_blank(value)]
    if not present:
        return "empty"

    bool_ratio = sum(1 for value in present if to_boolean(value) is not None) / len(present)
    uniques = {str(value).strip().lower() for value in present}
    if bool_ratio >= 0.95 and len(uniques) <= 2:
        return "boolean"

    if sum(1 for value in present if to_number(value) is not None) / len(present) >= 0.9:
        return "number"
    if sum(1 for value in present if to_date(value) is not None) / len(present) >= 0.9:
        return "date"
    return "text"


def build_column_meta(key: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    values = [row.get(key) for row in rows]
    present = [value for value in values if not is_blank(value)]
    column_type = detect_column_type(values)

    meta: dict[str, Any] = {
        "key": key,
        "label": key,
        "type": column_type,
        "filled": len(present),
        "missing": len(values) - len(present),
        "unique": len({str(value).strip() for value in present}),
        "sample": list(dict.fromkeys(str(value).strip() for value in present))[:4],
    }

    if column_type == "number":
        numbers = [n for n in (to_number(value) for value in present) if n is not None]
        if numbers:
            meta["min"] = min(numbers)
            meta["max"] = max(numbers)

    return meta
