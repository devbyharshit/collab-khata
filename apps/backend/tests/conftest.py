import pytest
import pytest_asyncio
import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base


@pytest_asyncio.fixture
async def test_engine():
    """Create test database engine."""
    # Use test database URL
    test_url = settings.test_database_url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(test_url, echo=False)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine):
    """Create test database session."""
    async_session = async_sessionmaker(
        test_engine, 
        class_=AsyncSession, 
        expire_on_commit=False
    )
    
    async with async_session() as session:
        try:
            yield session
        finally:
            # Always rollback to clean up
            await session.rollback()
            await session.close()