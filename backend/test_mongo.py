import asyncio
from app.db import get_db

async def test():
    result = await get_db().command("ping")
    print(result)
    print("MONGODB CONNECTION OK")

asyncio.run(test())