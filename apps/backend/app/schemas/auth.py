"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserRegister(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    """Schema for user profile response."""
    id: int
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True