from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.deps import get_current_user
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


def to_public(user: dict) -> UserPublic:
    return UserPublic(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest) -> AuthResponse:
    db = get_db()
    now = datetime.now(timezone.utc)
    document = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "created_at": now,
    }
    try:
        result = await db.users.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    document["_id"] = result.inserted_id
    user = to_public(document)
    return AuthResponse(token=create_access_token(user.id, user.role), user=user)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    # Same message for unknown email and wrong password: no account enumeration.
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    public = to_public(user)
    return AuthResponse(token=create_access_token(public.id, public.role), user=public)


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)) -> UserPublic:
    return to_public(user)
