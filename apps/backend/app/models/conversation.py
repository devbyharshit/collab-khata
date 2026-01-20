from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class CommunicationChannel(enum.Enum):
    """Enumeration for communication channels."""
    EMAIL = "Email"
    INSTAGRAM = "Instagram"
    WHATSAPP = "WhatsApp"
    PHONE = "Phone"
    IN_PERSON = "InPerson"
    OTHER = "Other"


class ConversationLog(Base):
    """Conversation log model for tracking communications."""
    __tablename__ = "conversation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    collaboration_id = Column(Integer, ForeignKey("collaborations.id"), nullable=False, index=True)
    channel = Column(Enum(CommunicationChannel), nullable=False)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    collaboration = relationship("Collaboration", back_populates="conversation_logs")