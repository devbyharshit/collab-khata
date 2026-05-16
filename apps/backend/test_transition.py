import asyncio
from httpx import AsyncClient
from app.main import app
from app.core.auth import get_current_user
from app.models.user import User
from fastapi.testclient import TestClient

client = TestClient(app)

async def mock_get_current_user():
    return User(id=7, email="test@test.com")

app.dependency_overrides[get_current_user] = mock_get_current_user

# Test transition to InProduction from Negotiating (should work if we change to Negotiating first)
print("1. Set to Negotiating")
r1 = client.patch("/api/collaborations/1/status", json={"status": "Negotiating", "posting_date": ""})
print(r1.status_code, r1.json())

print("\n2. Set to InProduction")
r2 = client.patch("/api/collaborations/1/status", json={"status": "InProduction", "posting_date": ""})
print(r2.status_code, r2.json())
