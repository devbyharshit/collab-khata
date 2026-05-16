"""
Performance optimization and validation tests.

Tests API response times, database query efficiency, and system performance
under various load conditions.

Validates Requirements: 8.5, 9.1
"""

import pytest
import pytest_asyncio
import time
from sqlalchemy import text, select, func as sql_func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus
from app.core.auth import get_password_hash
from datetime import date, timedelta


@pytest_asyncio.fixture
async def perf_db_engine():
    """Create performance test database engine."""
    test_url = settings.test_database_url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(test_url, echo=False, pool_size=20, max_overflow=40)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture
async def perf_session(perf_db_engine):
    """Create performance test session."""
    async_session = async_sessionmaker(
        perf_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.mark.asyncio
async def test_database_query_performance(perf_session):
    """
    Test database query performance with realistic data volumes.
    
    Validates: Requirements 9.1
    """
    # Create test user
    user = User(
        email="perftest@example.com",
        hashed_password=get_password_hash("password")
    )
    perf_session.add(user)
    await perf_session.commit()
    await perf_session.refresh(user)
    
    # Create 50 brands
    brands = []
    for i in range(50):
        brand = Brand(
            user_id=user.id,
            name=f"Brand {i}",
            contact_name=f"Contact {i}",
            contact_email=f"contact{i}@brand.com"
        )
        brands.append(brand)
    
    perf_session.add_all(brands)
    await perf_session.commit()
    
    # Create 200 collaborations
    collaborations = []
    for i in range(200):
        collab = Collaboration(
            user_id=user.id,
            brand_id=brands[i % 50].id,
            title=f"Collaboration {i}",
            platform="Instagram",
            agreed_amount=1000.0 + (i * 100),
            currency="USD",
            status=CollaborationStatus.CONFIRMED
        )
        collaborations.append(collab)
    
    perf_session.add_all(collaborations)
    await perf_session.commit()
    
    # Test query performance: List all collaborations
    start_time = time.time()
    result = await perf_session.execute(
        text("SELECT * FROM collaborations WHERE user_id = :user_id"),
        {"user_id": user.id}
    )
    collabs = result.fetchall()
    query_time = time.time() - start_time
    
    assert len(collabs) == 200
    assert query_time < 0.5, f"Query took {query_time}s, expected < 0.5s"


@pytest.mark.asyncio
async def test_dashboard_calculation_performance(perf_session):
    """
    Test dashboard calculation performance with multiple payments.
    
    Validates: Requirements 9.1
    """
    # Create test data
    user = User(
        email="dashperf@example.com",
        hashed_password=get_password_hash("password")
    )
    perf_session.add(user)
    await perf_session.commit()
    await perf_session.refresh(user)
    
    brand = Brand(user_id=user.id, name="Test Brand")
    perf_session.add(brand)
    await perf_session.commit()
    await perf_session.refresh(brand)
    
    # Create 100 collaborations with payments
    for i in range(100):
        collab = Collaboration(
            user_id=user.id,
            brand_id=brand.id,
            title=f"Collab {i}",
            platform="Instagram",
            agreed_amount=5000.0,
            currency="USD",
            status=CollaborationStatus.CONFIRMED
        )
        perf_session.add(collab)
        await perf_session.flush()
        
        # Add 2 payment expectations per collaboration
        for j in range(2):
            payment = PaymentExpectation(
                collaboration_id=collab.id,
                expected_amount=2500.0,
                promised_date=date.today() + timedelta(days=30),
                status=PaymentStatus.PENDING
            )
            perf_session.add(payment)
    
    await perf_session.commit()
    
    # Test dashboard calculation performance
    start_time = time.time()
    
    # Calculate total expected
    result = await perf_session.execute(
        text("""
            SELECT COALESCE(SUM(pe.expected_amount), 0) as total_expected
            FROM payment_expectations pe
            JOIN collaborations c ON pe.collaboration_id = c.id
            WHERE c.user_id = :user_id
        """),
        {"user_id": user.id}
    )
    total_expected = result.scalar()
    
    # Calculate total credited
    result = await perf_session.execute(
        text("""
            SELECT COALESCE(SUM(pc.credited_amount), 0) as total_credited
            FROM payment_credits pc
            JOIN payment_expectations pe ON pc.payment_expectation_id = pe.id
            JOIN collaborations c ON pe.collaboration_id = c.id
            WHERE c.user_id = :user_id
        """),
        {"user_id": user.id}
    )
    total_credited = result.scalar()
    
    calc_time = time.time() - start_time
    
    assert total_expected == 500000.0  # 100 collabs * 2 payments * 2500
    assert total_credited == 0.0
    assert calc_time < 0.3, f"Dashboard calculation took {calc_time}s, expected < 0.3s"


@pytest.mark.asyncio
async def test_bulk_insert_performance(perf_session):
    """
    Test bulk insert performance for conversation logs.
    
    Validates: Requirements 9.1
    """
    # Setup
    user = User(
        email="bulktest@example.com",
        hashed_password=get_password_hash("password")
    )
    perf_session.add(user)
    await perf_session.commit()
    await perf_session.refresh(user)
    
    brand = Brand(user_id=user.id, name="Bulk Brand")
    perf_session.add(brand)
    await perf_session.commit()
    await perf_session.refresh(brand)
    
    collab = Collaboration(
        user_id=user.id,
        brand_id=brand.id,
        title="Bulk Test",
        platform="Instagram",
        currency="USD",
        status=CollaborationStatus.LEAD
    )
    perf_session.add(collab)
    await perf_session.commit()
    
    # Test bulk insert of conversation logs
    from app.models.conversation import ConversationLog, CommunicationChannel
    
    start_time = time.time()
    
    conversations = []
    for i in range(100):
        conv = ConversationLog(
            collaboration_id=collab.id,
            channel=CommunicationChannel.EMAIL,
            message_text=f"Message {i}"
        )
        conversations.append(conv)
    
    perf_session.add_all(conversations)
    await perf_session.commit()
    
    insert_time = time.time() - start_time
    
    assert insert_time < 1.0, f"Bulk insert took {insert_time}s, expected < 1.0s"


@pytest.mark.asyncio
async def test_index_effectiveness(perf_session):
    """
    Test that database indexes are effective for common queries.
    
    Validates: Requirements 9.1
    """
    # Create test data
    user = User(
        email="indextest@example.com",
        hashed_password=get_password_hash("password")
    )
    perf_session.add(user)
    await perf_session.commit()
    await perf_session.refresh(user)
    
    brand = Brand(user_id=user.id, name="Index Brand")
    perf_session.add(brand)
    await perf_session.commit()
    await perf_session.refresh(brand)
    
    # Create 500 collaborations
    for i in range(500):
        collab = Collaboration(
            user_id=user.id,
            brand_id=brand.id,
            title=f"Collab {i}",
            platform="Instagram",
            status=[CollaborationStatus.LEAD, CollaborationStatus.NEGOTIATING, CollaborationStatus.CONFIRMED, CollaborationStatus.POSTED][i % 4],
            currency="USD"
        )
        perf_session.add(collab)
    
    await perf_session.commit()
    
    # Test indexed query performance (user_id index)
    start_time = time.time()
    result = await perf_session.execute(
        text("SELECT COUNT(*) FROM collaborations WHERE user_id = :user_id"),
        {"user_id": user.id}
    )
    count = result.scalar()
    query_time = time.time() - start_time
    
    assert count == 500
    assert query_time < 0.1, f"Indexed query took {query_time}s, expected < 0.1s"
    
    # Test status filter performance using ORM
    from sqlalchemy import select, func as sql_func
    start_time = time.time()
    result = await perf_session.execute(
        select(sql_func.count()).select_from(Collaboration).where(
            Collaboration.user_id == user.id,
            Collaboration.status == CollaborationStatus.CONFIRMED
        )
    )
    count = result.scalar()
    query_time = time.time() - start_time
    
    assert count == 125  # 500 / 4
    assert query_time < 0.1, f"Status filter query took {query_time}s, expected < 0.1s"


@pytest.mark.asyncio
async def test_connection_pool_efficiency(perf_db_engine):
    """
    Test database connection pool efficiency under concurrent load.
    
    Validates: Requirements 9.1
    """
    async_session = async_sessionmaker(
        perf_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    # Create test user
    async with async_session() as session:
        user = User(
            email="pooltest@example.com",
            hashed_password=get_password_hash("password")
        )
        session.add(user)
        await session.commit()
    
    # Simulate concurrent requests
    import asyncio
    
    async def query_user():
        async with async_session() as session:
            result = await session.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": "pooltest@example.com"}
            )
            return result.fetchone()
    
    start_time = time.time()
    
    # Run 50 concurrent queries
    tasks = [query_user() for _ in range(50)]
    results = await asyncio.gather(*tasks)
    
    total_time = time.time() - start_time
    
    assert len(results) == 50
    assert all(r is not None for r in results)
    assert total_time < 2.0, f"50 concurrent queries took {total_time}s, expected < 2.0s"
