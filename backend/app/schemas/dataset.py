from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ColumnMeta(BaseModel):
    key: str
    label: str
    type: Literal["number", "text", "date", "boolean", "empty"]
    filled: int
    missing: int
    unique: int
    sample: list[str] = []
    min: float | None = None
    max: float | None = None


class DatasetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    source: Literal["paste", "file"] = "paste"
    columns: list[ColumnMeta]
    rows: list[dict[str, Any]]


class DatasetOut(BaseModel):
    id: str
    name: str
    source: str
    created_at: datetime
    columns: list[ColumnMeta]
    row_count: int
    rows: list[dict[str, Any]] = []


class DatasetSummary(BaseModel):
    id: str
    name: str
    source: str
    created_at: datetime
    row_count: int
    column_count: int
