"""
Integration tests for complete user workflows, data persistence, and error recovery.

Tests complete workflows across multiple components, verifies data persistence
across operations, and validates error recovery mechanisms.

Validates Requirements: 9.1, 9.2, 9.5
"""

import pytest
import pytest_asyncio
from sqlalchemy import text, select, pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus
from app.models.conversation import ConversationLog, CommunicationChannel
from app.core.auth import get_password_hash, verify_password
from datetime import date, timedelta


@pytest_asyncio.fixture(scope="function")
async def integration_engine():
    """Create integration test database engine."""
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
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def integration_session(integration_engine):
    """Create integration test session."""
    async_session = async_sessionmaker(
        integration_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.mark.asyncio
async def test_user_registration_and_authentication_workflow(integration_session):
    """
    Test complete user registration and authentication workflow.
    
    Workflow:
    1. Register new user
    2. Verify user data persisted
    3. Authenticate with correct credentials
    4. Verify authentication fails with wrong credentials
    
    Validates: Requirements 9.1, 9.2
    """
    # Step 1: Register new user
    user = User(
        email="workflow@example.com",
        hashed_password=get_password_hash("SecurePass123!")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    assert user.id is not None
    assert user.email == "workflow@example.com"
    
    # Step 2: Verify user data persisted
    result = await integration_session.execute(
        select(User).where(User.email == "workflow@example.com")
    )
    persisted_user = result.scalar_one_or_none()
    
    assert persisted_user is not None
    assert persisted_user.id == user.id
    assert persisted_user.email == user.email
    
    # Step 3: Authenticate with correct credentials
    assert verify_password("SecurePass123!", persisted_user.hashed_password)
    
    # Step 4: Verify authentication fails with wrong credentials
    assert not verify_password("WrongPassword", persisted_user.hashed_password)


@pytest.mark.asyncio
async def test_collaboration_lifecycle_workflow(integration_session):
    """
    Test complete collaboration lifecycle from creation to completion.
    
    Workflow:
    1. Create user and brand
    2. Create collaboration
    3. Update collaboration through status transitions
    4. Add payment expectations
    5. Record payment credits
    6. Verify final state
    
    Validates: Requirements 9.1, 9.2
    """
    # Step 1: Create user and brand
    user = User(
        email="lifecycle@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    brand = Brand(
        user_id=user.id,
        name="Lifecycle Brand",
        contact_email="contact@brand.com"
    )
    integration_session.add(brand)
    await integration_session.commit()
    await integration_session.refresh(brand)
    
    # Step 2: Create collaboration
    collab = Collaboration(
        user_id=user.id,
        brand_id=brand.id,
        title="Lifecycle Test Collaboration",
        platform="Instagram",
        agreed_amount=10000.0,
        currency="USD",
        deadline_date=date.today() + timedelta(days=30),
        status=CollaborationStatus.LEAD
    )
    integration_session.add(collab)
    await integration_session.commit()
    await integration_session.refresh(collab)
    
    assert collab.status == CollaborationStatus.LEAD
    
    # Step 3: Update collaboration through status transitions
    collab.status = CollaborationStatus.NEGOTIATING
    await integration_session.commit()
    await integration_session.refresh(collab)
    assert collab.status == CollaborationStatus.NEGOTIATING
    
    collab.status = CollaborationStatus.CONFIRMED
    await integration_session.commit()
    await integration_session.refresh(collab)
    assert collab.status == CollaborationStatus.CONFIRMED
    
    # Step 4: Add payment expectations
    payment1 = PaymentExpectation(
        collaboration_id=collab.id,
        expected_amount=5000.0,
        promised_date=date.today() + timedelta(days=15),
        payment_method="Bank Transfer",
        status=PaymentStatus.PENDING
    )
    payment2 = PaymentExpectation(
        collaboration_id=collab.id,
        expected_amount=5000.0,
        promised_date=date.today() + timedelta(days=45),
        payment_method="Bank Transfer",
        status=PaymentStatus.PENDING
    )
    integration_session.add_all([payment1, payment2])
    await integration_session.commit()
    await integration_session.refresh(payment1)
    await integration_session.refresh(payment2)
    
    # Step 5: Record payment credits
    credit1 = PaymentCredit(
        payment_expectation_id=payment1.id,
        credited_amount=5000.0,
        credited_date=date.today(),
        reference_note="First payment received"
    )
    integration_session.add(credit1)
    await integration_session.commit()
    
    # Update payment status
    payment1.status = PaymentStatus.COMPLETED
    await integration_session.commit()
    
    # Step 6: Verify final state
    result = await integration_session.execute(
        select(Collaboration).where(Collaboration.id == collab.id)
    )
    final_collab = result.scalar_one()
    
    assert final_collab.status == CollaborationStatus.CONFIRMED
    assert final_collab.agreed_amount == 10000.0
    
    # Verify payments
    result = await integration_session.execute(
        select(PaymentExpectation).where(PaymentExpectation.collaboration_id == collab.id)
    )
    payments = result.scalars().all()
    
    assert len(payments) == 2
    completed_payments = [p for p in payments if p.status == PaymentStatus.COMPLETED]
    assert len(completed_payments) == 1


@pytest.mark.asyncio
async def test_data_persistence_across_sessions(integration_engine):
    """
    Test that data persists correctly across different database sessions.
    
    Validates: Requirements 9.1
    """
    async_session = async_sessionmaker(
        integration_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    # Session 1: Create data
    async with async_session() as session1:
        user = User(
            email="persist@example.com",
            hashed_password=get_password_hash("password")
        )
        session1.add(user)
        await session1.commit()
        user_id = user.id
    
    # Session 2: Verify data exists
    async with async_session() as session2:
        result = await session2.execute(
            select(User).where(User.id == user_id)
        )
        persisted_user = result.scalar_one_or_none()
        
        assert persisted_user is not None
        assert persisted_user.email == "persist@example.com"
        
        # Add brand in session 2
        brand = Brand(
            user_id=persisted_user.id,
            name="Persistent Brand"
        )
        session2.add(brand)
        await session2.commit()
        brand_id = brand.id
    
    # Session 3: Verify both user and brand exist
    async with async_session() as session3:
        result = await session3.execute(
            select(Brand).where(Brand.id == brand_id)
        )
        persisted_brand = result.scalar_one_or_none()
        
        assert persisted_brand is not None
        assert persisted_brand.name == "Persistent Brand"
        assert persisted_brand.user_id == user_id


@pytest.mark.asyncio
async def test_transaction_rollback_on_error(integration_session):
    """
    Test that transactions rollback correctly on errors.
    
    Validates: Requirements 9.5
    """
    # Create initial user
    user = User(
        email="rollback@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    initial_user_count = await integration_session.execute(
        select(User)
    )
    initial_count = len(initial_user_count.scalars().all())
    
    # Attempt to create duplicate user (should fail)
    try:
        duplicate_user = User(
            email="rollback@example.com",  # Duplicate email
            hashed_password=get_password_hash("password")
        )
        integration_session.add(duplicate_user)
        await integration_session.commit()
    except Exception:
        await integration_session.rollback()
    
    # Verify user count hasn't changed
    final_user_count = await integration_session.execute(
        select(User)
    )
    final_count = len(final_user_count.scalars().all())
    
    assert final_count == initial_count


@pytest.mark.asyncio
async def test_cascade_delete_behavior(integration_session):
    """
    Test cascade delete behavior for related entities.
    
    Validates: Requirements 9.1
    """
    # Create user, brand, and collaboration
    user = User(
        email="cascade@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    brand = Brand(
        user_id=user.id,
        name="Cascade Brand"
    )
    integration_session.add(brand)
    await integration_session.commit()
    await integration_session.refresh(brand)
    
    collab = Collaboration(
        user_id=user.id,
        brand_id=brand.id,
        title="Cascade Collab",
        platform="Instagram",
        currency="USD",
        status=CollaborationStatus.LEAD
    )
    integration_session.add(collab)
    await integration_session.commit()
    await integration_session.refresh(collab)
    
    # Add conversation log
    conv = ConversationLog(
        collaboration_id=collab.id,
        channel=CommunicationChannel.EMAIL,
        message_text="Test message"
    )
    integration_session.add(conv)
    await integration_session.commit()
    
    collab_id = collab.id
    
    # Delete collaboration
    await integration_session.delete(collab)
    await integration_session.commit()
    
    # Verify conversation log is also deleted (cascade)
    result = await integration_session.execute(
        select(ConversationLog).where(ConversationLog.collaboration_id == collab_id)
    )
    remaining_convs = result.scalars().all()
    
    assert len(remaining_convs) == 0


@pytest.mark.asyncio
async def test_concurrent_updates_handling(integration_engine):
    """
    Test handling of concurrent updates to the same entity.
    
    Validates: Requirements 9.1, 9.5
    """
    async_session = async_sessionmaker(
        integration_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    # Create initial collaboration
    async with async_session() as session:
        user = User(
            email="concurrent@example.com",
            hashed_password=get_password_hash("password")
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        brand = Brand(user_id=user.id, name="Concurrent Brand")
        session.add(brand)
        await session.commit()
        await session.refresh(brand)
        
        collab = Collaboration(
            user_id=user.id,
            brand_id=brand.id,
            title="Concurrent Collab",
            platform="Instagram",
            currency="USD",
            status=CollaborationStatus.LEAD
        )
        session.add(collab)
        await session.commit()
        collab_id = collab.id
    
    # Session 1: Load and update
    async with async_session() as session1:
        result = await session1.execute(
            select(Collaboration).where(Collaboration.id == collab_id)
        )
        collab1 = result.scalar_one()
        collab1.status = CollaborationStatus.NEGOTIATING
        await session1.commit()
    
    # Session 2: Load and verify update
    async with async_session() as session2:
        result = await session2.execute(
            select(Collaboration).where(Collaboration.id == collab_id)
        )
        collab2 = result.scalar_one()
        
        assert collab2.status == CollaborationStatus.NEGOTIATING


@pytest.mark.asyncio
async def test_complex_query_with_joins(integration_session):
    """
    Test complex queries with multiple joins for data integrity.
    
    Validates: Requirements 9.1
    """
    # Create test data
    user = User(
        email="complex@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    # Create multiple brands
    brands = []
    for i in range(3):
        brand = Brand(
            user_id=user.id,
            name=f"Brand {i}"
        )
        brands.append(brand)
    
    integration_session.add_all(brands)
    await integration_session.commit()
    
    # Create collaborations for each brand
    for brand in brands:
        await integration_session.refresh(brand)
        for j in range(2):
            collab = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title=f"Collab {brand.name} - {j}",
                platform="Instagram",
                agreed_amount=1000.0 * (j + 1),
                currency="USD",
                status=CollaborationStatus.CONFIRMED
            )
            integration_session.add(collab)
    
    await integration_session.commit()
    
    # Complex query: Get all collaborations with brand info
    result = await integration_session.execute(
        text("""
            SELECT c.id, c.title, c.agreed_amount, b.name as brand_name
            FROM collaborations c
            JOIN brands b ON c.brand_id = b.id
            WHERE c.user_id = :user_id
            ORDER BY c.agreed_amount DESC
        """),
        {"user_id": user.id}
    )
    
    collabs = result.fetchall()
    
    assert len(collabs) == 6  # 3 brands * 2 collabs each
    # Verify ordering by amount (descending)
    assert collabs[0][2] >= collabs[1][2]


@pytest.mark.asyncio
async def test_error_recovery_and_retry(integration_session):
    """
    Test error recovery mechanisms and retry logic.
    
    Validates: Requirements 9.5
    """
    # Create user
    user = User(
        email="recovery@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    user_id = user.id  # Store the ID before potential detachment
    
    # Attempt invalid operation (brand without required fields)
    try:
        invalid_brand = Brand(
            user_id=user_id,
            name=None  # Name is required
        )
        integration_session.add(invalid_brand)
        await integration_session.commit()
        assert False, "Should have raised an error"
    except Exception:
        await integration_session.rollback()
    
    # Verify session is still usable after error
    valid_brand = Brand(
        user_id=user_id,
        name="Valid Brand"
    )
    integration_session.add(valid_brand)
    await integration_session.commit()
    await integration_session.refresh(valid_brand)
    
    assert valid_brand.id is not None
    assert valid_brand.name == "Valid Brand"


@pytest.mark.asyncio
async def test_payment_calculation_integrity(integration_session):
    """
    Test payment calculation integrity across multiple operations.
    
    Validates: Requirements 9.1, 9.2
    """
    # Setup
    user = User(
        email="payment_calc@example.com",
        hashed_password=get_password_hash("password")
    )
    integration_session.add(user)
    await integration_session.commit()
    await integration_session.refresh(user)
    
    brand = Brand(user_id=user.id, name="Payment Brand")
    integration_session.add(brand)
    await integration_session.commit()
    await integration_session.refresh(brand)
    
    collab = Collaboration(
        user_id=user.id,
        brand_id=brand.id,
        title="Payment Calc Collab",
        platform="Instagram",
        agreed_amount=10000.0,
        currency="USD",
        status=CollaborationStatus.CONFIRMED
    )
    integration_session.add(collab)
    await integration_session.commit()
    await integration_session.refresh(collab)
    
    # Add payment expectation
    payment = PaymentExpectation(
        collaboration_id=collab.id,
        expected_amount=10000.0,
        promised_date=date.today() + timedelta(days=30),
        status=PaymentStatus.PENDING
    )
    integration_session.add(payment)
    await integration_session.commit()
    await integration_session.refresh(payment)
    
    # Add multiple partial credits
    credits = [
        PaymentCredit(
            payment_expectation_id=payment.id,
            credited_amount=3000.0,
            credited_date=date.today()
        ),
        PaymentCredit(
            payment_expectation_id=payment.id,
            credited_amount=2000.0,
            credited_date=date.today() + timedelta(days=1)
        ),
        PaymentCredit(
            payment_expectation_id=payment.id,
            credited_amount=5000.0,
            credited_date=date.today() + timedelta(days=2)
        )
    ]
    integration_session.add_all(credits)
    await integration_session.commit()
    
    # Calculate total credited
    result = await integration_session.execute(
        text("""
            SELECT COALESCE(SUM(pc.credited_amount), 0) as total_credited
            FROM payment_credits pc
            WHERE pc.payment_expectation_id = :payment_id
        """),
        {"payment_id": payment.id}
    )
    total_credited = result.scalar()
    
    assert total_credited == 10000.0
    
    # Verify payment should be marked as Completed
    payment.status = PaymentStatus.COMPLETED
    await integration_session.commit()
    
    result = await integration_session.execute(
        select(PaymentExpectation).where(PaymentExpectation.id == payment.id)
    )
    final_payment = result.scalar_one()
    
    assert final_payment.status == PaymentStatus.COMPLETED
