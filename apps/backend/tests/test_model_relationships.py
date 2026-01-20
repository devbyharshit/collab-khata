"""
Property-based tests for model relationships and data isolation.

Feature: brand-collaboration-tracker
Property 8: Data isolation by user
Validates: Requirements 2.2, 2.5, 5.5, 6.6, 7.6
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy import select
from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentStatus
from app.models.conversation import ConversationLog, CommunicationChannel
from app.models.file_attachment import FileAttachment
from decimal import Decimal
import uuid


class TestModelRelationships:
    """Test model relationships and data isolation."""
    
    @given(
        # Brand data
        brand_name=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs"))),
        # Collaboration data
        collab_title=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs"))),
        platform=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs"))),
        # Payment data
        payment_amount=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('10000.00'), places=2),
        # Conversation data
        message_text=st.text(min_size=1, max_size=500, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd", "Zs", "Po"))),
        # File data
        filename=st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Pc", "Pd"))),
        file_type=st.sampled_from(['pdf', 'jpg', 'png', 'doc', 'txt'])
    )
    @settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @pytest.mark.asyncio
    async def test_data_isolation_by_user(
        self, 
        test_session, 
        brand_name,
        collab_title,
        platform,
        payment_amount,
        message_text,
        filename,
        file_type
    ):
        """
        Property 8: Data isolation by user
        
        For any user and any entity type, querying entities should return only 
        those associated with that user and never return entities belonging to other users.
        
        This test creates data for two different users and verifies that:
        1. Each user can only see their own brands
        2. Each user can only see their own collaborations
        3. Each user can only see payment expectations for their collaborations
        4. Each user can only see conversation logs for their collaborations
        5. Each user can only see file attachments for their collaborations
        
        **Feature: brand-collaboration-tracker, Property 8: Data isolation by user**
        **Validates: Requirements 2.2, 2.5, 5.5, 6.6, 7.6**
        """
        # Create unique emails using UUIDs to avoid conflicts
        unique_id_1 = str(uuid.uuid4())
        unique_id_2 = str(uuid.uuid4())
        user1_email = f"user1_{unique_id_1}@test.com"
        user2_email = f"user2_{unique_id_2}@test.com"
        
        # Create two different users
        user1 = User(email=user1_email, hashed_password="password123")
        user2 = User(email=user2_email, hashed_password="password456")
        
        test_session.add(user1)
        test_session.add(user2)
        await test_session.flush()  # Use flush instead of commit to keep transaction open
        
        # Create brands for each user
        brand1 = Brand(user_id=user1.id, name=f"User1_{brand_name}")
        brand2 = Brand(user_id=user2.id, name=f"User2_{brand_name}")
        
        test_session.add(brand1)
        test_session.add(brand2)
        await test_session.flush()
        
        # Create collaborations for each user
        collab1 = Collaboration(
            user_id=user1.id,
            brand_id=brand1.id,
            title=f"User1_{collab_title}",
            platform=platform,
            currency="USD",
            status=CollaborationStatus.LEAD
        )
        collab2 = Collaboration(
            user_id=user2.id,
            brand_id=brand2.id,
            title=f"User2_{collab_title}",
            platform=platform,
            currency="USD",
            status=CollaborationStatus.LEAD
        )
        
        test_session.add(collab1)
        test_session.add(collab2)
        await test_session.flush()
        
        # Create payment expectations for each collaboration
        payment1 = PaymentExpectation(
            collaboration_id=collab1.id,
            expected_amount=payment_amount,
            status=PaymentStatus.PENDING
        )
        payment2 = PaymentExpectation(
            collaboration_id=collab2.id,
            expected_amount=payment_amount,
            status=PaymentStatus.PENDING
        )
        
        test_session.add(payment1)
        test_session.add(payment2)
        await test_session.flush()
        
        # Create conversation logs for each collaboration
        conv1 = ConversationLog(
            collaboration_id=collab1.id,
            channel=CommunicationChannel.EMAIL,
            message_text=f"User1_{message_text}"
        )
        conv2 = ConversationLog(
            collaboration_id=collab2.id,
            channel=CommunicationChannel.EMAIL,
            message_text=f"User2_{message_text}"
        )
        
        test_session.add(conv1)
        test_session.add(conv2)
        await test_session.flush()
        
        # Create file attachments for each collaboration
        file1 = FileAttachment(
            collaboration_id=collab1.id,
            file_path=f"/uploads/user1_{filename}.{file_type}",
            file_type=file_type,
            original_filename=f"user1_{filename}.{file_type}"
        )
        file2 = FileAttachment(
            collaboration_id=collab2.id,
            file_path=f"/uploads/user2_{filename}.{file_type}",
            file_type=file_type,
            original_filename=f"user2_{filename}.{file_type}"
        )
        
        test_session.add(file1)
        test_session.add(file2)
        await test_session.flush()
        
        # Test data isolation: User 1 should only see their own data
        
        # Test brand isolation
        user1_brands = await test_session.execute(
            select(Brand).where(Brand.user_id == user1.id)
        )
        user1_brands_list = user1_brands.scalars().all()
        
        assert len(user1_brands_list) == 1
        assert user1_brands_list[0].id == brand1.id
        assert user1_brands_list[0].name == f"User1_{brand_name}"
        
        # Test collaboration isolation
        user1_collabs = await test_session.execute(
            select(Collaboration).where(Collaboration.user_id == user1.id)
        )
        user1_collabs_list = user1_collabs.scalars().all()
        
        assert len(user1_collabs_list) == 1
        assert user1_collabs_list[0].id == collab1.id
        assert user1_collabs_list[0].title == f"User1_{collab_title}"
        
        # Test payment expectation isolation (through collaboration)
        user1_payments = await test_session.execute(
            select(PaymentExpectation)
            .join(Collaboration)
            .where(Collaboration.user_id == user1.id)
        )
        user1_payments_list = user1_payments.scalars().all()
        
        assert len(user1_payments_list) == 1
        assert user1_payments_list[0].collaboration_id == collab1.id
        
        # Test conversation log isolation (through collaboration)
        user1_convs = await test_session.execute(
            select(ConversationLog)
            .join(Collaboration)
            .where(Collaboration.user_id == user1.id)
        )
        user1_convs_list = user1_convs.scalars().all()
        
        assert len(user1_convs_list) == 1
        assert user1_convs_list[0].collaboration_id == collab1.id
        assert user1_convs_list[0].message_text == f"User1_{message_text}"
        
        # Test file attachment isolation (through collaboration)
        user1_files = await test_session.execute(
            select(FileAttachment)
            .join(Collaboration)
            .where(Collaboration.user_id == user1.id)
        )
        user1_files_list = user1_files.scalars().all()
        
        assert len(user1_files_list) == 1
        assert user1_files_list[0].collaboration_id == collab1.id
        assert user1_files_list[0].original_filename == f"user1_{filename}.{file_type}"
        
        # Test data isolation: User 2 should only see their own data
        
        # Test brand isolation for user 2
        user2_brands = await test_session.execute(
            select(Brand).where(Brand.user_id == user2.id)
        )
        user2_brands_list = user2_brands.scalars().all()
        
        assert len(user2_brands_list) == 1
        assert user2_brands_list[0].id == brand2.id
        assert user2_brands_list[0].name == f"User2_{brand_name}"
        
        # Test collaboration isolation for user 2
        user2_collabs = await test_session.execute(
            select(Collaboration).where(Collaboration.user_id == user2.id)
        )
        user2_collabs_list = user2_collabs.scalars().all()
        
        assert len(user2_collabs_list) == 1
        assert user2_collabs_list[0].id == collab2.id
        assert user2_collabs_list[0].title == f"User2_{collab_title}"
        
        # Verify cross-user isolation: User 1 cannot see User 2's data
        user1_cannot_see_user2_brands = await test_session.execute(
            select(Brand).where(Brand.user_id == user1.id).where(Brand.id == brand2.id)
        )
        assert user1_cannot_see_user2_brands.scalar_one_or_none() is None
        
        user1_cannot_see_user2_collabs = await test_session.execute(
            select(Collaboration).where(Collaboration.user_id == user1.id).where(Collaboration.id == collab2.id)
        )
        assert user1_cannot_see_user2_collabs.scalar_one_or_none() is None
        
        # Verify cross-user isolation: User 2 cannot see User 1's data
        user2_cannot_see_user1_brands = await test_session.execute(
            select(Brand).where(Brand.user_id == user2.id).where(Brand.id == brand1.id)
        )
        assert user2_cannot_see_user1_brands.scalar_one_or_none() is None
        
        user2_cannot_see_user1_collabs = await test_session.execute(
            select(Collaboration).where(Collaboration.user_id == user2.id).where(Collaboration.id == collab1.id)
        )
        assert user2_cannot_see_user1_collabs.scalar_one_or_none() is None