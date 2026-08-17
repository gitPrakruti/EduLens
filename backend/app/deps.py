from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_access_token
from app.db import get_db

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session has expired. Please log in again.",
    )
    if credentials is None:
        raise unauthorized

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise unauthorized

    try:
        user_oid = ObjectId(payload["sub"])
    except Exception as exc:  # invalid id in token
        raise unauthorized from exc

    user = await get_db().users.find_one({"_id": user_oid})
    if user is None:
        raise unauthorized
    return user
