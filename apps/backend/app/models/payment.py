from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Date, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class PaymentStatus(enum.Enum):
    """Enumeration for payment expectation status."""
    PENDING = "Pending"
    PARTIAL = "Partial"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"


class PaymentExpectation(Base):
    """Payment expectation model for tracking expected payments."""
    __tablename__ = "payment_expectations"
    
    id = Column(Integer, primary_key=True, index=True)
    collaboration_id = Column(Integer, ForeignKey("collaborations.id"), nullable=False, index=True)
    expected_amount = Column(Numeric(10, 2), nullable=False)
    promised_date = Column(Date, nullable=True)
    payment_method = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    collaboration = relationship("Collaboration", back_populates="payment_expectations")
    payment_credits = relationship("PaymentCredit", back_populates="payment_expectation", cascade="all, delete-orphan")


class PaymentCredit(Base):
    """Payment credit model for tracking actual payments received."""
    __tablename__ = "payment_credits"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_expectation_id = Column(Integer, ForeignKey("payment_expectations.id"), nullable=False, index=True)
    credited_amount = Column(Numeric(10, 2), nullable=False)
    credited_date = Column(Date, nullable=False)
    reference_note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    payment_expectation = relationship("PaymentExpectation", back_populates="payment_credits")