import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db

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
    await engine.dispose()

@pytest_asyncio.fixture
async def test_db_session(test_db_engine):
    """Create test database session."""
    async_session = async_sessionmaker(test_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest_asyncio.fixture
async def test_client(test_db_session):
    """Create test client with overridden dependencies."""
    async def override_get_db():
        yield test_db_session
        
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_brand_deletion_prevented_with_active_collaborations(test_client: AsyncClient):
    # 1. Register and Login to get auth token
    await test_client.post("/api/auth/register", json={"email": "collab@test.com", "password": "securepassword123"})
    login_resp = await test_client.post("/api/auth/login", json={"email": "collab@test.com", "password": "securepassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a brand
    brand_response = await test_client.post(
        "/api/brands/",
        json={"name": "Test Brand To Delete", "contact_email": "test@test.com"},
        headers=headers
    )
    brand_id = brand_response.json()["id"]

    # 3. Create a collaboration for this brand
    await test_client.post(
        "/api/collaborations/",
        json={
            "brand_id": brand_id,
            "title": "Test Collab",
            "platform": "Instagram",
            "currency": "USD"
        },
        headers=headers
    )

    # 4. Try to delete the brand, it should fail
    delete_response = await test_client.delete(
        f"/api/brands/{brand_id}",
        headers=headers
    )
    print(delete_response.json())
    assert delete_response.status_code == 400
    assert "Cannot delete brand with active collaborations" in delete_response.json()["error"]["message"]

@pytest.mark.asyncio
async def test_collaboration_status_can_jump_to_closed(test_client: AsyncClient):
    # Register/Login
    await test_client.post("/api/auth/register", json={"email": "status@test.com", "password": "securepassword123"})
    login_resp = await test_client.post("/api/auth/login", json={"email": "status@test.com", "password": "securepassword123"})
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Create a brand
    brand_response = await test_client.post(
        "/api/brands/",
        json={"name": "Test Brand For Collab"},
        headers=headers
    )
    brand_id = brand_response.json()["id"]

    # Create a collaboration (starts in LEAD)
    collab_response = await test_client.post(
        "/api/collaborations/",
        json={
            "brand_id": brand_id,
            "title": "Test Collab Transition",
            "platform": "YouTube",
            "currency": "USD"
        },
        headers=headers
    )
    collab_id = collab_response.json()["id"]

    # Transition directly to CLOSED
    status_response = await test_client.patch(
        f"/api/collaborations/{collab_id}/status",
        json={"status": "Closed"},
        headers=headers
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "Closed"

@pytest.mark.asyncio
async def test_pydantic_whitespace_stripping_and_limits(test_client: AsyncClient):
    # Register/Login
    await test_client.post("/api/auth/register", json={"email": "valid@test.com", "password": "securepassword123"})
    login_resp = await test_client.post("/api/auth/login", json={"email": "valid@test.com", "password": "securepassword123"})
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Try to create a brand with just spaces
    brand_response = await test_client.post(
        "/api/brands/",
        json={"name": "   ", "notes": "  test   "},
        headers=headers
    )
    # The spaces will be stripped to "", which violates min_length=1
    assert brand_response.status_code == 422
    
    # Try to register a user with a weak password
    register_response = await test_client.post(
        "/api/auth/register",
        json={"email": "weak@test.com", "password": "short"}
    )
    # Violates min_length=8
    assert register_response.status_code == 422
