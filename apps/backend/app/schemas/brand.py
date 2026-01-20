"""
Brand schemas for request/response validation.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BrandCreate(BaseModel):
    """Schema for brand creation request."""
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_channel: Optional[str] = None
    notes: Optional[str] = None


class BrandUpdate(BaseModel):
    """Schema for brand update request."""
    name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_channel: Optional[str] = None
    notes: Optional[str] = None


class BrandResponse(BaseModel):
    """Schema for brand response."""
    id: int
    user_id: int
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_channel: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True