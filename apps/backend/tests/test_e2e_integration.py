"""
End-to-end integration tests for complete user workflows.

Tests complete user journeys from registration through collaboration management
to payment tracking, verifying data consistency and integration between components.

Validates Requirements: 9.1, 9.2
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db
import os
import tempfile
from datetime import date, datetime, timedelta


@pytest_asyncio.fixture
async def test_db_engine():
    """Create test database engine and tables."""
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


@pytest_asyncio.fixture
async def test_db_session(test_db_engine):
    """Create test database session."""
    async_session = async_sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def client(test_db_session):
    """Create test client with database override."""
    async def override_get_db():
        yield test_db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test", follow_redirects=True) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def temp_upload_dir():
    """Create temporary upload directory for file tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        original_upload_dir = settings.upload_dir
        settings.upload_dir = tmpdir
        yield tmpdir
        settings.upload_dir = original_upload_dir


@pytest.mark.asyncio
async def test_complete_user_workflow_registration_to_payment(client, temp_upload_dir):
    """
    Test complete user workflow from registration through payment tracking.
    
    Workflow:
    1. User registration
    2. User login
    3. Create brand
    4. Create collaboration
    5. Update collaboration status
    6. Add payment expectation
    7. Record payment credit
    8. View dashboard
    9. Verify data consistency
    
    Validates: Requirements 9.1, 9.2
    """
    # Step 1: User Registration
    register_data = {
        "email": "creator@example.com",
        "password": "SecurePass123!"
    }
    register_response = await client.post("/api/auth/register", json=register_data)
    assert register_response.status_code == 201
    user_data = register_response.json()
    assert user_data["email"] == register_data["email"]
    assert "id" in user_data
    user_id = user_data["id"]
    
    # Step 2: User Login
    login_response = await client.post("/api/auth/login", json=register_data)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 3: Create Brand
    brand_data = {
        "name": "TechBrand Inc",
        "contact_name": "John Doe",
        "contact_email": "john@techbrand.com",
        "contact_channel": "Email",
        "notes": "Great brand to work with"
    }
    brand_response = await client.post("/api/brands", json=brand_data, headers=headers)
    assert brand_response.status_code == 201
    brand = brand_response.json()
    assert brand["name"] == brand_data["name"]
    assert brand["user_id"] == user_id
    brand_id = brand["id"]
    
    # Step 4: Create Collaboration
    collab_data = {
        "brand_id": brand_id,
        "title": "Product Review Campaign",
        "platform": "Instagram",
        "deliverables_text": "1 reel + 3 stories",
        "agreed_amount": 5000.00,
        "currency": "INR",
        "deadline_date": (date.today() + timedelta(days=7)).isoformat(),
        "status": "Lead"
    }
    collab_response = await client.post("/api/collaborations", json=collab_data, headers=headers)
    assert collab_response.status_code == 201
    collab = collab_response.json()
    assert collab["title"] == collab_data["title"]
    assert collab["status"] == "Lead"
    collab_id = collab["id"]
    
    # Step 5: Update Collaboration Status (Lead -> Negotiating -> Confirmed)
    status_update_1 = await client.patch(
        f"/api/collaborations/{collab_id}/status",
        json={"status": "Negotiating"},
        headers=headers
    )
    assert status_update_1.status_code == 200
    assert status_update_1.json()["status"] == "Negotiating"
    
    status_update_2 = await client.patch(
        f"/api/collaborations/{collab_id}/status",
        json={"status": "Confirmed"},
        headers=headers
    )
    assert status_update_2.status_code == 200
    assert status_update_2.json()["status"] == "Confirmed"
    
    # Step 6: Add Payment Expectation
    payment_data = {
        "expected_amount": 5000.00,
        "promised_date": (date.today() + timedelta(days=30)).isoformat(),
        "payment_method": "Bank Transfer",
        "notes": "Full payment expected"
    }
    payment_response = await client.post(
        f"/api/collaborations/{collab_id}/payments",
        json=payment_data,
        headers=headers
    )
    assert payment_response.status_code == 201
    payment = payment_response.json()
    assert float(payment["expected_amount"]) == payment_data["expected_amount"]
    assert payment["status"] == "Pending"
    payment_id = payment["id"]
    
    # Step 7: Record Payment Credit (Partial Payment)
    credit_data = {
        "credited_amount": 2500.00,
        "credited_date": date.today().isoformat(),
        "reference_note": "First installment"
    }
    credit_response = await client.post(
        f"/api/payments/{payment_id}/credits",
        json=credit_data,
        headers=headers
    )
    assert credit_response.status_code == 201
    credit = credit_response.json()
    assert float(credit["credited_amount"]) == credit_data["credited_amount"]
    
    # Verify payment status updated to Partial
    payment_check = await client.get(
        f"/api/collaborations/{collab_id}/payments",
        headers=headers
    )
    assert payment_check.status_code == 200
    payments_response = payment_check.json()
    payments = payments_response["payment_expectations"]
    assert len(payments) == 1
    assert payments[0]["status"] == "Partial"
    
    # Step 8: View Dashboard
    dashboard_response = await client.get("/api/dashboard", headers=headers)
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    
    # Step 9: Verify Data Consistency
    assert float(dashboard["financial_summary"]["total_expected"]) == 5000.00
    assert float(dashboard["financial_summary"]["total_credited"]) == 2500.00
    assert float(dashboard["financial_summary"]["pending_amount"]) == 2500.00
    
    # Find Confirmed status count
    confirmed_count = 0
    for status_count in dashboard["collaboration_status_counts"]:
        if status_count["status"] == "Confirmed":
            confirmed_count = status_count["count"]
            break
    assert confirmed_count == 1
    
    # Verify brand list
    brands_response = await client.get("/api/brands", headers=headers)
    assert brands_response.status_code == 200
    brands = brands_response.json()
    assert len(brands) == 1
    assert brands[0]["id"] == brand_id
    
    # Verify collaboration list
    collabs_response = await client.get("/api/collaborations", headers=headers)
    assert collabs_response.status_code == 200
    collabs_data = collabs_response.json()
    collabs = collabs_data["collaborations"]
    assert len(collabs) == 1
    assert collabs[0]["id"] == collab_id


@pytest.mark.asyncio
async def test_file_upload_and_download_integration(client, temp_upload_dir):
    """
    Test file upload and download integration.
    
    Workflow:
    1. Register and login user
    2. Create brand and collaboration
    3. Upload file to collaboration
    4. Download file and verify content
    5. List files for collaboration
    
    Validates: Requirements 9.1, 9.2
    """
    # Setup: Register and login
    register_data = {"email": "filetest@example.com", "password": "Pass123!"}
    await client.post("/api/auth/register", json=register_data)
    login_response = await client.post("/api/auth/login", json=register_data)
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create brand
    brand_response = await client.post(
        "/api/brands",
        json={"name": "FileBrand"},
        headers=headers
    )
    brand_id = brand_response.json()["id"]
    
    # Create collaboration
    collab_response = await client.post(
        "/api/collaborations",
        json={
            "brand_id": brand_id,
            "title": "File Test Collab",
            "platform": "YouTube",
            "currency": "USD"
        },
        headers=headers
    )
    collab_id = collab_response.json()["id"]
    
    # Upload file
    file_content = b"Test file content for integration testing"
    files = {
        "file": ("test_document.txt", file_content, "text/plain")
    }
    upload_response = await client.post(
        f"/api/collaborations/{collab_id}/files",
        files=files,
        headers=headers
    )
    assert upload_response.status_code == 200
    file_data = upload_response.json()
    assert file_data["original_filename"] == "test_document.txt"
    assert file_data["file_type"] == "text/plain"
    file_id = file_data["id"]
    
    # Download file
    download_response = await client.get(f"/api/files/{file_id}", headers=headers)
    assert download_response.status_code == 200
    assert download_response.content == file_content
    
    # List files for collaboration
    files_response = await client.get(
        f"/api/collaborations/{collab_id}/files",
        headers=headers
    )
    assert files_response.status_code == 200
    files_list = files_response.json()
    assert len(files_list) == 1
    assert files_list[0]["id"] == file_id


@pytest.mark.asyncio
async def test_conversation_log_integration(client):
    """
    Test conversation log integration with collaborations.
    
    Workflow:
    1. Setup user, brand, and collaboration
    2. Add multiple conversation logs
    3. Verify chronological ordering
    4. Verify data persistence
    
    Validates: Requirements 9.1, 9.2
    """
    # Setup
    register_data = {"email": "convtest@example.com", "password": "Pass123!"}
    await client.post("/api/auth/register", json=register_data)
    login_response = await client.post("/api/auth/login", json=register_data)
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    brand_response = await client.post(
        "/api/brands",
        json={"name": "ConvBrand"},
        headers=headers
    )
    brand_id = brand_response.json()["id"]
    
    collab_response = await client.post(
        "/api/collaborations",
        json={
            "brand_id": brand_id,
            "title": "Conversation Test",
            "platform": "Instagram",
            "currency": "USD"
        },
        headers=headers
    )
    collab_id = collab_response.json()["id"]
    
    # Add conversation logs
    conv1_response = await client.post(
        f"/api/collaborations/{collab_id}/conversations",
        json={
            "channel": "Email",
            "message_text": "Initial outreach email"
        },
        headers=headers
    )
    assert conv1_response.status_code == 200
    
    conv2_response = await client.post(
        f"/api/collaborations/{collab_id}/conversations",
        json={
            "channel": "WhatsApp",
            "message_text": "Follow-up discussion"
        },
        headers=headers
    )
    assert conv2_response.status_code == 200
    
    # Retrieve conversations
    convs_response = await client.get(
        f"/api/collaborations/{collab_id}/conversations",
        headers=headers
    )
    assert convs_response.status_code == 200
    conversations = convs_response.json()
    assert len(conversations) == 2
    
    # Verify chronological ordering
    assert conversations[0]["message_text"] == "Initial outreach email"
    assert conversations[1]["message_text"] == "Follow-up discussion"
    assert conversations[0]["created_at"] <= conversations[1]["created_at"]


@pytest.mark.asyncio
async def test_data_isolation_between_users(client):
    """
    Test that users can only access their own data.
    
    Workflow:
    1. Create two users
    2. Each user creates brands and collaborations
    3. Verify each user can only see their own data
    4. Verify unauthorized access is prevented
    
    Validates: Requirements 9.1, 9.2
    """
    # Create User 1
    user1_data = {"email": "user1@example.com", "password": "Pass123!"}
    await client.post("/api/auth/register", json=user1_data)
    login1 = await client.post("/api/auth/login", json=user1_data)
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    # Create User 2
    user2_data = {"email": "user2@example.com", "password": "Pass123!"}
    await client.post("/api/auth/register", json=user2_data)
    login2 = await client.post("/api/auth/login", json=user2_data)
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 1 creates brand and collaboration
    brand1_response = await client.post(
        "/api/brands",
        json={"name": "User1 Brand"},
        headers=headers1
    )
    brand1_id = brand1_response.json()["id"]
    
    collab1_response = await client.post(
        "/api/collaborations",
        json={
            "brand_id": brand1_id,
            "title": "User1 Collab",
            "platform": "Instagram",
            "currency": "USD"
        },
        headers=headers1
    )
    collab1_id = collab1_response.json()["id"]
    
    # User 2 creates brand and collaboration
    brand2_response = await client.post(
        "/api/brands",
        json={"name": "User2 Brand"},
        headers=headers2
    )
    brand2_id = brand2_response.json()["id"]
    
    collab2_response = await client.post(
        "/api/collaborations",
        json={
            "brand_id": brand2_id,
            "title": "User2 Collab",
            "platform": "YouTube",
            "currency": "EUR"
        },
        headers=headers2
    )
    collab2_id = collab2_response.json()["id"]
    
    # Verify User 1 can only see their own brands
    user1_brands = await client.get("/api/brands", headers=headers1)
    brands1 = user1_brands.json()
    assert len(brands1) == 1
    assert brands1[0]["name"] == "User1 Brand"
    
    # Verify User 2 can only see their own brands
    user2_brands = await client.get("/api/brands", headers=headers2)
    brands2 = user2_brands.json()
    assert len(brands2) == 1
    assert brands2[0]["name"] == "User2 Brand"
    
    # Verify User 1 cannot access User 2's collaboration
    unauthorized_access = await client.get(
        f"/api/collaborations/{collab2_id}",
        headers=headers1
    )
    assert unauthorized_access.status_code == 404
    
    # Verify User 2 cannot access User 1's collaboration
    unauthorized_access2 = await client.get(
        f"/api/collaborations/{collab1_id}",
        headers=headers2
    )
    assert unauthorized_access2.status_code == 404


@pytest.mark.asyncio
async def test_payment_workflow_with_multiple_expectations(client):
    """
    Test payment workflow with multiple payment expectations.
    
    Workflow:
    1. Create collaboration with multiple payment milestones
    2. Add multiple payment expectations
    3. Record credits for different expectations
    4. Verify dashboard calculations
    5. Test overdue payment detection
    
    Validates: Requirements 9.1, 9.2
    """
    # Setup
    register_data = {"email": "payment@example.com", "password": "Pass123!"}
    await client.post("/api/auth/register", json=register_data)
    login_response = await client.post("/api/auth/login", json=register_data)
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    brand_response = await client.post(
        "/api/brands",
        json={"name": "PaymentBrand"},
        headers=headers
    )
    brand_id = brand_response.json()["id"]
    
    collab_response = await client.post(
        "/api/collaborations",
        json={
            "brand_id": brand_id,
            "title": "Multi-Payment Collab",
            "platform": "YouTube",
            "agreed_amount": 10000.00,
            "currency": "USD"
        },
        headers=headers
    )
    collab_id = collab_response.json()["id"]
    
    # Add first payment expectation (50% upfront)
    payment1_response = await client.post(
        f"/api/collaborations/{collab_id}/payments",
        json={
            "expected_amount": 5000.00,
            "promised_date": (date.today() - timedelta(days=5)).isoformat(),  # Overdue
            "payment_method": "Bank Transfer",
            "notes": "50% upfront"
        },
        headers=headers
    )
    payment1_id = payment1_response.json()["id"]
    
    # Add second payment expectation (50% on delivery)
    payment2_response = await client.post(
        f"/api/collaborations/{collab_id}/payments",
        json={
            "expected_amount": 5000.00,
            "promised_date": (date.today() + timedelta(days=30)).isoformat(),
            "payment_method": "Bank Transfer",
            "notes": "50% on delivery"
        },
        headers=headers
    )
    payment2_id = payment2_response.json()["id"]
    
    # Record full credit for first payment
    await client.post(
        f"/api/payments/{payment1_id}/credits",
        json={
            "credited_amount": 5000.00,
            "credited_date": date.today().isoformat(),
            "reference_note": "Upfront payment received"
        },
        headers=headers
    )
    
    # Record partial credit for second payment
    await client.post(
        f"/api/payments/{payment2_id}/credits",
        json={
            "credited_amount": 2000.00,
            "credited_date": date.today().isoformat(),
            "reference_note": "Partial payment"
        },
        headers=headers
    )
    
    # Verify dashboard calculations
    dashboard_response = await client.get("/api/dashboard", headers=headers)
    dashboard = dashboard_response.json()
    
    assert float(dashboard["financial_summary"]["total_expected"]) == 10000.00
    assert float(dashboard["financial_summary"]["total_credited"]) == 7000.00
    assert float(dashboard["financial_summary"]["pending_amount"]) == 3000.00
    
    # Verify payment statuses
    payments_response = await client.get(
        f"/api/collaborations/{collab_id}/payments",
        headers=headers
    )
    payments = payments_response.json()["payment_expectations"]
    assert len(payments) == 2
    
    # First payment should be Completed
    payment1 = next(p for p in payments if p["id"] == payment1_id)
    assert payment1["status"] == "Completed"
    
    # Second payment should be Partial
    payment2 = next(p for p in payments if p["id"] == payment2_id)
    assert payment2["status"] == "Partial"
