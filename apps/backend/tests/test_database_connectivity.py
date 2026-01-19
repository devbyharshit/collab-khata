"""
Property-based tests for database connectivity and CRUD operations.

Feature: brand-collaboration-tracker
Property 21: CRUD operation persistence
Validates: Requirements 9.1
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy import select
from app.models.test_model import TestEntityModel


class TestDatabaseConnectivity:
    """Test database connectivity and CRUD operation persistence."""
    
    @given(
        name=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs"))),
        description=st.one_of(st.none(), st.text(max_size=500, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs", "Po"))))
    )
    @settings(max_examples=10, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @pytest.mark.asyncio
    async def test_crud_operation_persistence(self, test_session, name, description):
        """
        Property 21: CRUD operation persistence
        
        For any valid entity data, CRUD operations should persist correctly:
        - CREATE: Entity should be created and retrievable
        - READ: Created entity should be readable with correct data
        - UPDATE: Entity updates should persist correctly
        - DELETE: Entity should be removable and no longer retrievable
        
        **Feature: brand-collaboration-tracker, Property 21: CRUD operation persistence**
        **Validates: Requirements 9.1**
        """
        # CREATE: Create a new test entity
        test_entity = TestEntityModel(name=name, description=description)
        test_session.add(test_entity)
        await test_session.commit()
        await test_session.refresh(test_entity)
        
        # Verify entity was created with an ID
        assert test_entity.id is not None
        assert test_entity.name == name
        assert test_entity.description == description
        assert test_entity.created_at is not None
        
        entity_id = test_entity.id
        
        # READ: Retrieve the entity from database
        stmt = select(TestEntityModel).where(TestEntityModel.id == entity_id)
        result = await test_session.execute(stmt)
        retrieved_entity = result.scalar_one_or_none()
        
        # Verify entity was retrieved correctly
        assert retrieved_entity is not None
        assert retrieved_entity.id == entity_id
        assert retrieved_entity.name == name
        assert retrieved_entity.description == description
        assert retrieved_entity.created_at is not None
        
        # UPDATE: Modify the entity
        new_name = f"Updated_{name}"
        new_description = f"Updated_{description}" if description else "Updated description"
        
        retrieved_entity.name = new_name
        retrieved_entity.description = new_description
        await test_session.commit()
        await test_session.refresh(retrieved_entity)
        
        # Verify update persisted
        assert retrieved_entity.name == new_name
        assert retrieved_entity.description == new_description
        assert retrieved_entity.updated_at is not None
        
        # READ after UPDATE: Retrieve updated entity
        stmt = select(TestEntityModel).where(TestEntityModel.id == entity_id)
        result = await test_session.execute(stmt)
        updated_entity = result.scalar_one_or_none()
        
        # Verify updated data persisted
        assert updated_entity is not None
        assert updated_entity.name == new_name
        assert updated_entity.description == new_description
        
        # DELETE: Remove the entity
        await test_session.delete(updated_entity)
        await test_session.commit()
        
        # Verify entity was deleted
        stmt = select(TestEntityModel).where(TestEntityModel.id == entity_id)
        result = await test_session.execute(stmt)
        deleted_entity = result.scalar_one_or_none()
        
        assert deleted_entity is None