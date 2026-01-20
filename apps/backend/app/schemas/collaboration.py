"""
Collaboration schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

from app.models.collaboration import CollaborationStatus


class CollaborationCreate(BaseModel):
    """Schema for collaboration creation request."""
    brand_id: int = Field(..., description="ID of the brand for this collaboration")
    title: str = Field(..., min_length=1, max_length=255, description="Title of the collaboration")
    platform: str = Field(..., min_length=1, max_length=100, description="Platform for the collaboration")
    deliverables_text: Optional[str] = Field(None, description="Description of deliverables")
    agreed_amount: Optional[Decimal] = Field(None, ge=0, description="Agreed amount for the collaboration")
    currency: str = Field("USD", min_length=3, max_length=3, description="Currency code")
    deadline_date: Optional[date] = Field(None, description="Deadline for the collaboration")


class CollaborationUpdate(BaseModel):
    """Schema for collaboration update request."""
    brand_id: Optional[int] = Field(None, description="ID of the brand for this collaboration")
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Title of the collaboration")
    platform: Optional[str] = Field(None, min_length=1, max_length=100, description="Platform for the collaboration")
    deliverables_text: Optional[str] = Field(None, description="Description of deliverables")
    agreed_amount: Optional[Decimal] = Field(None, ge=0, description="Agreed amount for the collaboration")
    currency: Optional[str] = Field(None, min_length=3, max_length=3, description="Currency code")
    deadline_date: Optional[date] = Field(None, description="Deadline for the collaboration")


class CollaborationStatusUpdate(BaseModel):
    """Schema for collaboration status update request."""
    status: CollaborationStatus = Field(..., description="New status for the collaboration")
    posting_date: Optional[date] = Field(None, description="Posting date (required when status is Posted)")


class CollaborationResponse(BaseModel):
    """Schema for collaboration response."""
    id: int
    user_id: int
    brand_id: int
    title: str
    platform: str
    deliverables_text: Optional[str] = None
    agreed_amount: Optional[Decimal] = None
    currency: str
    deadline_date: Optional[date] = None
    posting_date: Optional[date] = None
    status: CollaborationStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CollaborationListResponse(BaseModel):
    """Schema for collaboration list response with filtering metadata."""
    collaborations: List[CollaborationResponse]
    total_count: int
    filtered_count: int