from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Date, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class CollaborationStatus(enum.Enum):
    """Enumeration for collaboration status workflow."""
    LEAD = "Lead"
    NEGOTIATING = "Negotiating"
    CONFIRMED = "Confirmed"
    IN_PRODUCTION = "InProduction"
    POSTED = "Posted"
    PAYMENT_PENDING = "PaymentPending"
    OVERDUE = "Overdue"
    PAID = "Paid"
    CLOSED = "Closed"


class Collaboration(Base):
    """Collaboration model for tracking brand partnerships."""
    __tablename__ = "collaborations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    platform = Column(String(100), nullable=False)
    deliverables_text = Column(Text, nullable=True)
    agreed_amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(3), nullable=False, default="USD")
    deadline_date = Column(Date, nullable=True)
    posting_date = Column(Date, nullable=True)
    status = Column(Enum(CollaborationStatus), nullable=False, default=CollaborationStatus.LEAD)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="collaborations")
    brand = relationship("Brand", back_populates="collaborations")
    payment_expectations = relationship("PaymentExpectation", back_populates="collaboration", cascade="all, delete-orphan")
    conversation_logs = relationship("ConversationLog", back_populates="collaboration", cascade="all, delete-orphan")
    file_attachments = relationship("FileAttachment", back_populates="collaboration", cascade="all, delete-orphan")