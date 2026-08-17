from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.db import get_db
from app.deps import get_current_user
from app.schemas.filter import (
    ApplyFilterRequest,
    ApplyFilterResponse,
    HistoryOut,
    SavedFilterCreate,
    SavedFilterOut,
)
from app.services.filter_engine import apply_filters, describe_group

router = APIRouter(tags=["filters"])


async def _load_dataset(dataset_id: str, user_id: str) -> dict:
    if not ObjectId.is_valid(dataset_id):
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
    document = await get_db().datasets.find_one({"_id": ObjectId(dataset_id), "user_id": user_id})
    if not document:
        raise HTTPException(status_code=404, detail="That dataset could not be found.")
    return document


@router.post("/filters/apply", response_model=ApplyFilterResponse)
async def apply_filter(payload: ApplyFilterRequest, user=Depends(get_current_user)) -> dict:
    """Runs the rule group against the dataset and records the run in history."""
    user_id = str(user["_id"])
    dataset = await _load_dataset(payload.dataset_id, user_id)

    rows = dataset.get("rows", [])
    matched = apply_filters(rows, payload.group)
    summary = describe_group(payload.group)

    await get_db().history.insert_one(
        {
            "user_id": user_id,
            "dataset_id": payload.dataset_id,
            "dataset_name": dataset["name"],
            "group": payload.group.model_dump(),
            "summary": summary,
            "matched": len(matched),
            "total": len(rows),
            "created_at": datetime.now(timezone.utc),
        }
    )

    return {"matched": len(matched), "total": len(rows), "summary": summary, "rows": matched}


@router.post("/filters", response_model=SavedFilterOut, status_code=status.HTTP_201_CREATED)
async def save_filter(payload: SavedFilterCreate, user=Depends(get_current_user)) -> dict:
    user_id = str(user["_id"])
    dataset = await _load_dataset(payload.dataset_id, user_id)

    document = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "dataset_id": payload.dataset_id,
        "dataset_name": dataset["name"],
        "group": payload.group.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().filters.insert_one(document)
    document["id"] = str(result.inserted_id)
    return document


@router.get("/filters", response_model=list[SavedFilterOut])
async def list_filters(user=Depends(get_current_user)) -> list[dict]:
    cursor = get_db().filters.find({"user_id": str(user["_id"])}).sort("created_at", -1)
    return [{**document, "id": str(document["_id"])} async for document in cursor]


@router.delete("/filters/{filter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_filter(filter_id: str, user=Depends(get_current_user)) -> None:
    if not ObjectId.is_valid(filter_id):
        raise HTTPException(status_code=404, detail="That filter could not be found.")
    result = await get_db().filters.delete_one(
        {"_id": ObjectId(filter_id), "user_id": str(user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="That filter could not be found.")


@router.get("/history", response_model=list[HistoryOut])
async def list_history(user=Depends(get_current_user)) -> list[dict]:
    cursor = (
        get_db().history.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50)
    )
    return [{**document, "id": str(document["_id"])} async for document in cursor]


@router.delete("/history/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_entry(entry_id: str, user=Depends(get_current_user)) -> None:
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=404, detail="That entry could not be found.")
    result = await get_db().history.delete_one(
        {"_id": ObjectId(entry_id), "user_id": str(user["_id"])}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="That entry could not be found.")
