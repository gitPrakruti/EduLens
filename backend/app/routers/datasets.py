from datetime import datetime, timezone
from io import BytesIO

import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.db import get_db
from app.deps import get_current_user
from app.schemas.dataset import DatasetCreate, DatasetOut, DatasetSummary
from app.services.type_detection import build_column_meta

router = APIRouter(prefix="/datasets", tags=["datasets"])

MAX_ROWS = 20000


def _serialise(document: dict, include_rows: bool = False) -> dict:
    payload = {
        "id": str(document["_id"]),
        "name": document["name"],
        "source": document["source"],
        "created_at": document["created_at"],
        "columns": document["columns"],
        "row_count": document["row_count"],
    }
    if include_rows:
        payload["rows"] = document.get("rows", [])
    return payload


@router.post("/parse", status_code=status.HTTP_200_OK)
async def parse_spreadsheet(file: UploadFile = File(...), user=Depends(get_current_user)) -> dict:
    """Parses an uploaded .xlsx/.xls/.csv file into headers, rows and column metadata."""
    content = await file.read()
    name = (file.filename or "dataset").rsplit(".", 1)[0]
    try:
        if (file.filename or "").lower().endswith(".csv"):
            frame = pd.read_csv(BytesIO(content))
        else:
            frame = pd.read_excel(BytesIO(content), sheet_name=0)
    except Exception:
        raise HTTPException(status_code=400, detail="That file could not be read. Please check the format.")

    frame = frame.dropna(how="all").where(pd.notna(frame), None)
    if frame.empty:
        raise HTTPException(status_code=400, detail="That file has no student rows.")
    if len(frame) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"Please upload at most {MAX_ROWS} rows.")

    headers = [str(column).strip() or f"Column {i + 1}" for i, column in enumerate(frame.columns)]
    frame.columns = headers
    rows = frame.to_dict(orient="records")

    return {
        "name": name,
        "headers": headers,
        "rows": rows,
        "columns": [build_column_meta(header, rows) for header in headers],
    }


@router.post("", response_model=DatasetOut, status_code=status.HTTP_201_CREATED)
async def create_dataset(payload: DatasetCreate, user=Depends(get_current_user)) -> dict:
    if not payload.rows:
        raise HTTPException(status_code=400, detail="A dataset needs at least one student row.")

    document = {
        "user_id": str(user["_id"]),
        "name": payload.name.strip(),
        "source": payload.source,
        "created_at": datetime.now(timezone.utc),
        "columns": [column.model_dump() for column in payload.columns],
        "rows": payload.rows,
        "row_count": len(payload.rows),
    }
    result = await get_db().datasets.insert_one(document)
    document["_id"] = result.inserted_id
    return _serialise(document, include_rows=True)


@router.get("", response_model=list[DatasetSummary])
async def list_datasets(user=Depends(get_current_user)) -> list[dict]:
    cursor = get_db().datasets.find(
        {"user_id": str(user["_id"])},
        {"rows": 0},
    ).sort("created_at", -1)
    return [
        {
            "id": str(document["_id"]),
            "name": document["name"],
            "source": document["source"],
            "created_at": document["created_at"],
            "row_count": document["row_count"],
            "column_count": len(document["columns"]),
        }
        async for document in cursor
    ]


@router.get("/{dataset_id}", response_model=DatasetOut)
async def get_dataset(dataset_id: str, user=Depends(get_current_user)) -> dict:
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
    document = await get_db().datasets.find_one(
        {"_id": ObjectId(dataset_id), "user_id": str(user["_id"])}
    )
    if not document:
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
    return _serialise(document, include_rows=True)


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(dataset_id: str, user=Depends(get_current_user)) -> None:
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
    result = await get_db().datasets.delete_one(
        {"_id": ObjectId(dataset_id), "user_id": str(user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
