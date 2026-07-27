"""
Brand schemas for request/response validation.
"""
from pydantic import BaseModel, Field, EmailStr, model_validator
from datetime import datetime
from typing import Optional


class BrandCreate(BaseModel):
    """Schema for brand creation request."""
    name: str = Field(..., min_length=1, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_channel: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)

    @model_validator(mode='before')
    @classmethod
    def strip_whitespace(cls, data):
        if isinstance(data, dict):
            for field in ['name', 'contact_name', 'contact_email', 'contact_channel', 'notes']:
                if field in data and isinstance(data[field], str):
                    data[field] = data[field].strip()
            for field in ['contact_name', 'contact_email', 'contact_channel', 'notes']:
                if field in data and data[field] == "":
                    data[field] = None
        return data


class BrandUpdate(BaseModel):
    """Schema for brand update request."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_channel: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)

    @model_validator(mode='before')
    @classmethod
    def strip_whitespace(cls, data):
        if isinstance(data, dict):
            for field in ['name', 'contact_name', 'contact_email', 'contact_channel', 'notes']:
                if field in data and isinstance(data[field], str):
                    data[field] = data[field].strip()
            for field in ['contact_name', 'contact_email', 'contact_channel', 'notes']:
                if field in data and data[field] == "":
                    data[field] = None
        return data


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