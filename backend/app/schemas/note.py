from datetime import datetime

from pydantic import BaseModel, Field


class NoteUpdate(BaseModel):
    content: str = Field(default="", max_length=100_000)


class NoteOut(BaseModel):
    content: str
    updated_at: datetime
