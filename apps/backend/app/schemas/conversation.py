from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.conversation import CommunicationChannel


class ConversationLogBase(BaseModel):
    """Base schema for conversation logs."""
    channel: CommunicationChannel = Field(..., description="Communication channel used")
    message_text: str = Field(..., min_length=1, max_length=10000, description="Content of the conversation")


class ConversationLogCreate(ConversationLogBase):
    """Schema for creating conversation logs."""
    pass


class ConversationLogUpdate(BaseModel):
    """Schema for updating conversation logs."""
    channel: Optional[CommunicationChannel] = Field(None, description="Communication channel used")
    message_text: Optional[str] = Field(None, min_length=1, max_length=10000, description="Content of the conversation")


class ConversationLogResponse(ConversationLogBase):
    """Schema for conversation log responses."""
    id: int
    collaboration_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True