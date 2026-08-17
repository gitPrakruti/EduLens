from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongodb_uri)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[get_settings().mongodb_db]


async def create_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.datasets.create_index([("user_id", 1), ("created_at", -1)])
    await db.filter_templates.create_index([("user_id", 1), ("created_at", -1)])
    await db.analysis_history.create_index([("user_id", 1), ("created_at", -1)])
    await db.notes.create_index("user_id", unique=True)
