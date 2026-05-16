import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.collaboration import Collaboration

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Collaboration).limit(10))
        collaborations = result.scalars().all()
        for c in collaborations:
            print(f"ID: {c.id}, Status: {c.status}, Type: {type(c.status)}")

asyncio.run(main())
