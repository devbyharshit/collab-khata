from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class FileAttachment(Base):
    """File attachment model for managing uploaded files."""
    __tablename__ = "file_attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    collaboration_id = Column(Integer, ForeignKey("collaborations.id"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    collaboration = relationship("Collaboration", back_populates="file_attachments")