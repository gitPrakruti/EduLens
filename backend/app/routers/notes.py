from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.db import get_db
from app.deps import get_current_user
from app.schemas.note import NoteOut, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=NoteOut)
async def get_note(user: dict = Depends(get_current_user)) -> NoteOut:
    note = await get_db().notes.find_one({"user_id": str(user["_id"])})
    if note is None:
        return NoteOut(content="", updated_at=datetime.now(timezone.utc))
    return NoteOut(content=note.get("content", ""), updated_at=note["updated_at"])


@router.put("", response_model=NoteOut)
async def save_note(payload: NoteUpdate, user: dict = Depends(get_current_user)) -> NoteOut:
    now = datetime.now(timezone.utc)
    await get_db().notes.update_one(
        {"user_id": str(user["_id"])},
        {"$set": {"content": payload.content, "updated_at": now}},
        upsert=True,
    )
    return NoteOut(content=payload.content, updated_at=now)


@router.delete("", status_code=204)
async def clear_note(user: dict = Depends(get_current_user)) -> None:
    await get_db().notes.delete_one({"user_id": str(user["_id"])})
