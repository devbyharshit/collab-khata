from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("Starting test")
# Try to mock out the get_current_user dependency
from app.core.auth import get_current_user
from app.models.user import User

async def mock_get_current_user():
    user = User(id=7, email="test@test.com")
    return user

app.dependency_overrides[get_current_user] = mock_get_current_user

response = client.patch(
    "/api/collaborations/1/status",
    json={"status": "Overdue", "posting_date": ""}
)
print(response.status_code)
print(response.json())
