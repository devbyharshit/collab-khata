"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRegister(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


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