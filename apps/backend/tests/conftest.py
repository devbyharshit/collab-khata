import pytest
import pytest_asyncio
import asyncio
import os
from hypothesis import settings as hypothesis_settings, HealthCheck
from sqlalchemy import create_engine, text, pool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base

# Configure Hypothesis profiles
hypothesis_settings.register_profile("ci", max_examples=100, deadline=None)
hypothesis_settings.register_profile("dev", max_examples=10, deadline=None)
hypothesis_settings.register_profile("fast", max_examples=2, deadline=None)

# Set the default profile based on an environment variable, defaulting to "dev" for local runs
profile = os.getenv("HYPOTHESIS_PROFILE", "dev")
hypothesis_settings.load_profile(profile)

@pytest_asyncio.fixture
async def test_engine():
    """Create test database engine."""
    # Use test database URL
    test_url = settings.test_database_url.replace("postgresql://", "postgresql+asyncpg://")
    if "?" in test_url:
        test_url += "&prepared_statement_cache_size=0"
    else:
        test_url += "?prepared_statement_cache_size=0"
        
    engine = create_async_engine(
        test_url,
        echo=False,
        poolclass=pool.NullPool,
    )
    
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