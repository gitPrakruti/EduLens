from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Operator = Literal[
    "eq",
    "neq",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "before",
    "after",
    "on",
    "is_true",
    "is_false",
    "is_empty",
    "is_not_empty",
    "in",
]


class FilterRule(BaseModel):
    id: str = ""
    column: str
    operator: Operator
    value: str = ""
    value2: str = ""


class FilterGroup(BaseModel):
    combinator: Literal["AND", "OR"] = "AND"
    rules: list[FilterRule] = []


class ApplyFilterRequest(BaseModel):
    dataset_id: str
    group: FilterGroup


class ApplyFilterResponse(BaseModel):
    matched: int
    total: int
    summary: str
    rows: list[dict[str, Any]]


class SavedFilterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    dataset_id: str
    group: FilterGroup


class SavedFilterOut(BaseModel):
    id: str
    name: str
    dataset_id: str
    dataset_name: str
    group: FilterGroup
    created_at: datetime


class HistoryOut(BaseModel):
    id: str
    dataset_id: str
    dataset_name: str
    group: FilterGroup
    summary: str
    matched: int
    total: int
    created_at: datetime
