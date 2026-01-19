"""Simple database connection test."""

import pytest
from sqlalchemy import text


class TestSimpleDatabase:
    """Simple database connectivity test."""
    
    @pytest.mark.asyncio
    async def test_database_connection(self, test_session):
        """Test basic database connection."""
        result = await test_session.execute(text("SELECT 1 as test_value"))
        row = result.fetchone()
        assert row[0] == 1