from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Role = Literal["teacher", "hod"]


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Please enter your full name.")
        return cleaned


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic
