from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import os
import uuid
import mimetypes
from pathlib import Path

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.collaboration import Collaboration
from app.models.conversation import ConversationLog
from app.models.file_attachment import FileAttachment
from app.schemas.conversation import ConversationLogCreate, ConversationLogResponse
from app.schemas.file_attachment import FileAttachmentResponse, FileUploadResponse
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["conversations"])

# File upload configuration
ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.txt', '.rtf',  # Documents
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',  # Images
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',  # Videos
    '.mp3', '.wav', '.aac', '.flac',  # Audio
    '.zip', '.rar', '.7z',  # Archives
    '.xls', '.xlsx', '.csv',  # Spreadsheets
    '.ppt', '.pptx'  # Presentations
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.get("/collaborations/{collaboration_id}/conversations", response_model=List[ConversationLogResponse])
async def get_conversation_logs(
    collaboration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversation logs for a collaboration in chronological order."""
    
    # Verify collaboration exists and belongs to user
    collaboration = db.query(Collaboration).filter(
        Collaboration.id == collaboration_id,
        Collaboration.user_id == current_user.id
    ).first()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Get conversation logs ordered chronologically (oldest first)
    conversation_logs = db.query(ConversationLog).filter(
        ConversationLog.collaboration_id == collaboration_id
    ).order_by(ConversationLog.created_at.asc()).all()
    
    return conversation_logs


@router.post("/collaborations/{collaboration_id}/conversations", response_model=ConversationLogResponse)
async def create_conversation_log(
    collaboration_id: int,
    conversation_data: ConversationLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new conversation log to a collaboration."""
    
    # Verify collaboration exists and belongs to user
    collaboration = db.query(Collaboration).filter(
        Collaboration.id == collaboration_id,
        Collaboration.user_id == current_user.id
    ).first()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Create conversation log
    conversation_log = ConversationLog(
        collaboration_id=collaboration_id,
        channel=conversation_data.channel,
        message_text=conversation_data.message_text
    )
    
    db.add(conversation_log)
    db.commit()
    db.refresh(conversation_log)
    
    return conversation_log


@router.get("/collaborations/{collaboration_id}/files", response_model=List[FileAttachmentResponse])
async def get_file_attachments(
    collaboration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all file attachments for a collaboration."""
    
    # Verify collaboration exists and belongs to user
    collaboration = db.query(Collaboration).filter(
        Collaboration.id == collaboration_id,
        Collaboration.user_id == current_user.id
    ).first()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Get file attachments ordered by creation date (newest first)
    file_attachments = db.query(FileAttachment).filter(
        FileAttachment.collaboration_id == collaboration_id
    ).order_by(desc(FileAttachment.created_at)).all()
    
    return file_attachments


@router.post("/collaborations/{collaboration_id}/files", response_model=FileUploadResponse)
async def upload_file(
    collaboration_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file attachment to a collaboration."""
    
    # Verify collaboration exists and belongs to user
    collaboration = db.query(Collaboration).filter(
        Collaboration.id == collaboration_id,
        Collaboration.user_id == current_user.id
    ).first()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file_extension}' is not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Create user-specific upload directory
    user_upload_dir = Path(settings.upload_dir) / str(current_user.id) / str(collaboration_id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Full file path
    file_path = user_upload_dir / unique_filename
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file"
        )
    
    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(file.filename)
    if not mime_type:
        mime_type = "application/octet-stream"
    
    # Create file attachment record
    file_attachment = FileAttachment(
        collaboration_id=collaboration_id,
        file_path=str(file_path),
        file_type=mime_type,
        original_filename=file.filename
    )
    
    db.add(file_attachment)
    db.commit()
    db.refresh(file_attachment)
    
    return FileUploadResponse(
        id=file_attachment.id,
        original_filename=file_attachment.original_filename,
        file_type=file_attachment.file_type,
        file_size=len(content),
        created_at=file_attachment.created_at
    )


@router.get("/files/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a file attachment."""
    
    # Get file attachment
    file_attachment = db.query(FileAttachment).filter(
        FileAttachment.id == file_id
    ).first()
    
    if not file_attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Verify user owns the collaboration
    collaboration = db.query(Collaboration).filter(
        Collaboration.id == file_attachment.collaboration_id,
        Collaboration.user_id == current_user.id
    ).first()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Check if file exists on disk
    if not os.path.exists(file_attachment.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Return file
    return FileResponse(
        path=file_attachment.file_path,
        filename=file_attachment.original_filename,
        media_type=file_attachment.file_type
    )