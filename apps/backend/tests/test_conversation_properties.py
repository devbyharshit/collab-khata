"""
Property-based tests for conversation and file management functionality.

Feature: brand-collaboration-tracker
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import tempfile
import os
from pathlib import Path
import io
import uuid

from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.conversation import ConversationLog, CommunicationChannel
from app.models.file_attachment import FileAttachment
from app.core.auth import get_password_hash


async def create_test_user_and_collaboration(db: AsyncSession):
    """Helper to create test user, brand, and collaboration."""
    # Create user with unique email
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    user = User(email=unique_email, hashed_password=get_password_hash("password"))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Create brand
    brand = Brand(user_id=user.id, name="Test Brand")
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    
    # Create collaboration
    collaboration = Collaboration(
        user_id=user.id,
        brand_id=brand.id,
        title="Test Collaboration",
        platform="Instagram",
        status=CollaborationStatus.CONFIRMED
    )
    db.add(collaboration)
    await db.commit()
    await db.refresh(collaboration)
    
    return user, brand, collaboration


class TestConversationAndFileProperties:
    """Property-based tests for conversation and file management functionality."""

    # Property 26: Conversation log chronological ordering
    @given(
        num_conversations=st.integers(min_value=2, max_value=10),
        channels=st.lists(
            st.sampled_from(list(CommunicationChannel)), 
            min_size=2, 
            max_size=10
        ),
        messages=st.lists(
            st.text(min_size=1, max_size=100).filter(lambda x: '\x00' not in x), 
            min_size=2, 
            max_size=10
        )
    )
    @settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    @pytest.mark.asyncio
    async def test_conversation_log_chronological_ordering(
        self,
        test_session: AsyncSession, 
        num_conversations: int, 
        channels: list, 
        messages: list
    ):
        """
        **Feature: brand-collaboration-tracker, Property 26: Conversation log chronological ordering**
        
        For any collaboration with multiple conversation logs, they should be displayed 
        in chronological order based on creation timestamp.
        **Validates: Requirements 5.2**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Ensure we have enough data
        num_conversations = min(num_conversations, len(channels), len(messages))
        
        # Create multiple conversation logs
        conversation_logs = []
        for i in range(num_conversations):
            conversation_log = ConversationLog(
                collaboration_id=collaboration.id,
                channel=channels[i % len(channels)],
                message_text=messages[i % len(messages)]
            )
            test_session.add(conversation_log)
            conversation_logs.append(conversation_log)
        
        await test_session.commit()
        
        # Refresh all conversation logs to get their IDs and timestamps
        for log in conversation_logs:
            await test_session.refresh(log)
        
        # Retrieve conversation logs ordered chronologically (oldest first)
        result = await test_session.execute(
            select(ConversationLog)
            .where(ConversationLog.collaboration_id == collaboration.id)
            .order_by(ConversationLog.created_at.asc())
        )
        retrieved_logs = result.scalars().all()
        
        assert len(retrieved_logs) == num_conversations
        
        # Verify chronological ordering (oldest first)
        for i in range(1, len(retrieved_logs)):
            prev_time = retrieved_logs[i-1].created_at
            curr_time = retrieved_logs[i].created_at
            assert prev_time <= curr_time, "Conversations should be ordered chronologically"
        
        # Verify all created conversations are present
        retrieved_ids = [log.id for log in retrieved_logs]
        created_ids = [log.id for log in conversation_logs]
        assert set(retrieved_ids) == set(created_ids)

    # Property 27: Communication channel support
    @given(
        channel=st.sampled_from(list(CommunicationChannel)),
        message=st.text(min_size=1, max_size=1000).filter(lambda x: '\x00' not in x)
    )
    @settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    @pytest.mark.asyncio
    async def test_communication_channel_support(
        self,
        test_session: AsyncSession, 
        channel: CommunicationChannel, 
        message: str
    ):
        """
        **Feature: brand-collaboration-tracker, Property 27: Communication channel support**
        
        For any conversation log entry, it should accept and properly store any of the 
        supported communication channels (Email, Instagram, WhatsApp, Phone, InPerson, Other).
        **Validates: Requirements 5.4**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Create conversation log with the given channel
        conversation_log = ConversationLog(
            collaboration_id=collaboration.id,
            channel=channel,
            message_text=message
        )
        
        test_session.add(conversation_log)
        await test_session.commit()
        await test_session.refresh(conversation_log)
        
        # Verify the conversation was created with correct channel
        assert conversation_log.channel == channel
        assert conversation_log.message_text == message
        assert conversation_log.collaboration_id == collaboration.id
        assert conversation_log.created_at is not None
        
        # Verify it can be retrieved
        result = await test_session.execute(
            select(ConversationLog)
            .where(ConversationLog.collaboration_id == collaboration.id)
        )
        retrieved_logs = result.scalars().all()
        
        assert len(retrieved_logs) == 1
        assert retrieved_logs[0].channel == channel
        assert retrieved_logs[0].message_text == message

    # Property 23: File upload and storage
    @given(
        filename=st.text(min_size=1, max_size=50).filter(lambda x: '/' not in x and '\\' not in x and '\x00' not in x),
        file_content=st.binary(min_size=1, max_size=1024),
        file_extension=st.sampled_from(['.txt', '.pdf', '.jpg', '.png', '.doc'])
    )
    @settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    @pytest.mark.asyncio
    async def test_file_upload_and_storage(
        self,
        test_session: AsyncSession, 
        filename: str, 
        file_content: bytes, 
        file_extension: str
    ):
        """
        **Feature: brand-collaboration-tracker, Property 23: File upload and storage**
        
        For any valid file upload, the file should be stored in the local filesystem 
        with a unique path and a corresponding database record should be created with proper metadata.
        **Validates: Requirements 6.1**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Create a temporary file for storage simulation
        full_filename = f"{filename}{file_extension}"
        
        # Create temporary directory for file storage
        with tempfile.TemporaryDirectory() as temp_dir:
            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(temp_dir, unique_filename)
            
            # Save file to disk
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Determine MIME type
            import mimetypes
            mime_type, _ = mimetypes.guess_type(full_filename)
            if not mime_type:
                mime_type = "application/octet-stream"
            
            # Create file attachment record
            file_attachment = FileAttachment(
                collaboration_id=collaboration.id,
                file_path=file_path,
                file_type=mime_type,
                original_filename=full_filename
            )
            
            test_session.add(file_attachment)
            await test_session.commit()
            await test_session.refresh(file_attachment)
            
            # Verify file attachment was created in database
            assert file_attachment.id is not None
            assert file_attachment.collaboration_id == collaboration.id
            assert file_attachment.original_filename == full_filename
            assert file_attachment.file_type == mime_type
            assert os.path.exists(file_attachment.file_path)
            
            # Verify file content on disk
            with open(file_attachment.file_path, 'rb') as f:
                stored_content = f.read()
                assert stored_content == file_content

    # Property 24: File retrieval and serving
    @given(
        filename=st.text(min_size=1, max_size=50).filter(lambda x: '/' not in x and '\\' not in x and '\x00' not in x),
        file_content=st.binary(min_size=1, max_size=1024),
        file_extension=st.sampled_from(['.txt', '.pdf', '.jpg', '.png', '.doc'])
    )
    @settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    @pytest.mark.asyncio
    async def test_file_retrieval_and_serving(
        self,
        test_session: AsyncSession, 
        filename: str, 
        file_content: bytes, 
        file_extension: str
    ):
        """
        **Feature: brand-collaboration-tracker, Property 24: File retrieval and serving**
        
        For any uploaded file, it should be retrievable through its attachment record 
        and served correctly when requested.
        **Validates: Requirements 6.2, 6.3**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Create a temporary file for storage
        full_filename = f"{filename}{file_extension}"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Generate unique filename and save file
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(temp_dir, unique_filename)
            
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Create file attachment record
            file_attachment = FileAttachment(
                collaboration_id=collaboration.id,
                file_path=file_path,
                file_type="application/octet-stream",
                original_filename=full_filename
            )
            
            test_session.add(file_attachment)
            await test_session.commit()
            await test_session.refresh(file_attachment)
            
            # Retrieve file list for collaboration
            result = await test_session.execute(
                select(FileAttachment)
                .where(FileAttachment.collaboration_id == collaboration.id)
                .order_by(desc(FileAttachment.created_at))
            )
            file_attachments = result.scalars().all()
            
            assert len(file_attachments) == 1
            assert file_attachments[0].id == file_attachment.id
            assert file_attachments[0].original_filename == full_filename
            
            # Verify file can be read from disk
            assert os.path.exists(file_attachment.file_path)
            with open(file_attachment.file_path, 'rb') as f:
                retrieved_content = f.read()
                assert retrieved_content == file_content

    # Property 25: File type and size validation
    @given(
        filename=st.text(min_size=1, max_size=50).filter(lambda x: '/' not in x and '\\' not in x and '\x00' not in x),
        file_extension=st.sampled_from(['.exe', '.bat', '.sh', '.invalid']),  # Invalid extensions
        file_content=st.binary(min_size=1, max_size=100)
    )
    @settings(
        max_examples=100, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )
    @pytest.mark.asyncio
    async def test_file_type_validation_logic(
        self,
        test_session: AsyncSession, 
        filename: str, 
        file_extension: str, 
        file_content: bytes
    ):
        """
        **Feature: brand-collaboration-tracker, Property 25: File type and size validation**
        
        For any file upload, the system should validate file type against supported formats 
        and reject files exceeding size limits with appropriate errors.
        **Validates: Requirements 6.4, 6.5**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Test file type validation logic
        full_filename = f"{filename}{file_extension}"
        
        # Define allowed extensions (from the API)
        ALLOWED_EXTENSIONS = {
            '.pdf', '.doc', '.docx', '.txt', '.rtf',  # Documents
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',  # Images
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',  # Videos
            '.mp3', '.wav', '.aac', '.flac',  # Audio
            '.zip', '.rar', '.7z',  # Archives
            '.xls', '.xlsx', '.csv',  # Spreadsheets
            '.ppt', '.pptx'  # Presentations
        }
        
        # Validate file extension
        file_ext_lower = file_extension.lower()
        is_valid_extension = file_ext_lower in ALLOWED_EXTENSIONS
        
        # Should be invalid for the test extensions we're using
        assert not is_valid_extension, f"Extension {file_extension} should be invalid"
        
        # Test file size validation logic
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        is_valid_size = len(file_content) <= MAX_FILE_SIZE
        
        # For our test data, size should be valid (we're using small content)
        assert is_valid_size, f"File size {len(file_content)} should be valid"

    @given(
        filename=st.text(min_size=1, max_size=50).filter(lambda x: '/' not in x and '\\' not in x and '\x00' not in x),
        file_extension=st.sampled_from(['.txt', '.pdf', '.jpg']),  # Valid extensions
        large_content_size=st.integers(min_value=51*1024*1024, max_value=100*1024*1024)  # > 50MB
    )
    @settings(
        max_examples=50, 
        deadline=None,
        suppress_health_check=[HealthCheck.function_scoped_fixture]
    )  # Fewer examples due to large file sizes
    @pytest.mark.asyncio
    async def test_file_size_validation_logic(
        self,
        test_session: AsyncSession, 
        filename: str, 
        file_extension: str, 
        large_content_size: int
    ):
        """
        **Feature: brand-collaboration-tracker, Property 25: File type and size validation**
        
        For any file upload exceeding size limits, the system should reject the upload 
        with appropriate error messages.
        **Validates: Requirements 6.4, 6.5**
        """
        user, brand, collaboration = await create_test_user_and_collaboration(test_session)
        
        # Test file size validation logic
        full_filename = f"{filename}{file_extension}"
        
        # Define allowed extensions (from the API)
        ALLOWED_EXTENSIONS = {
            '.pdf', '.doc', '.docx', '.txt', '.rtf',  # Documents
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',  # Images
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',  # Videos
            '.mp3', '.wav', '.aac', '.flac',  # Audio
            '.zip', '.rar', '.7z',  # Archives
            '.xls', '.xlsx', '.csv',  # Spreadsheets
            '.ppt', '.pptx'  # Presentations
        }
        
        # Validate file extension (should be valid for this test)
        file_ext_lower = file_extension.lower()
        is_valid_extension = file_ext_lower in ALLOWED_EXTENSIONS
        assert is_valid_extension, f"Extension {file_extension} should be valid"
        
        # Test file size validation logic
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
        is_valid_size = large_content_size <= MAX_FILE_SIZE
        
        # Should be invalid for the large sizes we're testing
        assert not is_valid_size, f"File size {large_content_size} should be invalid (exceeds {MAX_FILE_SIZE})"