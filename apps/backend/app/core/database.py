from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .config import settings

# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg2://"),
    echo=settings.debug
)

# Async engine for FastAPI operations
async_engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.debug
)

# Session makers
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
AsyncSessionLocal = async_sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Import models to ensure they are registered with Base
from app.models.test_model import TestEntityModel
from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration
from app.models.payment import PaymentExpectation, PaymentCredit
from app.models.conversation import ConversationLog
from app.models.file_attachment import FileAttachment


# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Sync session for migrations and testing
def get_sync_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()