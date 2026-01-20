from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FileAttachmentBase(BaseModel):
    """Base schema for file attachments."""
    original_filename: str = Field(..., min_length=1, max_length=255, description="Original filename")
    file_type: str = Field(..., min_length=1, max_length=100, description="MIME type of the file")


class FileAttachmentCreate(FileAttachmentBase):
    """Schema for creating file attachments."""
    file_path: str = Field(..., min_length=1, max_length=500, description="Path to stored file")


class FileAttachmentResponse(FileAttachmentBase):
    """Schema for file attachment responses."""
    id: int
    collaboration_id: int
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Schema for file upload responses."""
    id: int
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime
    
    class Config:
        from_attributes = True