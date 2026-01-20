"""
Pydantic schemas for payment management.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from app.models.payment import PaymentStatus


class PaymentExpectationBase(BaseModel):
    """Base schema for payment expectations."""
    expected_amount: Decimal = Field(..., gt=0, description="Expected payment amount")
    promised_date: Optional[date] = Field(None, description="Promised payment date")
    payment_method: Optional[str] = Field(None, max_length=100, description="Payment method")
    notes: Optional[str] = Field(None, description="Additional notes")


class PaymentExpectationCreate(PaymentExpectationBase):
    """Schema for creating payment expectations."""
    
    @validator('expected_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Expected amount must be greater than 0')
        return v
    
    @validator('payment_method')
    def validate_payment_method(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v


class PaymentExpectationUpdate(BaseModel):
    """Schema for updating payment expectations."""
    expected_amount: Optional[Decimal] = Field(None, gt=0, description="Expected payment amount")
    promised_date: Optional[date] = Field(None, description="Promised payment date")
    payment_method: Optional[str] = Field(None, max_length=100, description="Payment method")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    @validator('expected_amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Expected amount must be greater than 0')
        return v
    
    @validator('payment_method')
    def validate_payment_method(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v


class PaymentCreditBase(BaseModel):
    """Base schema for payment credits."""
    credited_amount: Decimal = Field(..., gt=0, description="Credited payment amount")
    credited_date: date = Field(..., description="Date when payment was credited")
    reference_note: Optional[str] = Field(None, max_length=255, description="Payment reference note")


class PaymentCreditCreate(PaymentCreditBase):
    """Schema for creating payment credits."""
    
    @validator('credited_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Credited amount must be greater than 0')
        return v
    
    @validator('reference_note')
    def validate_reference_note(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v


class PaymentCreditResponse(PaymentCreditBase):
    """Schema for payment credit responses."""
    id: int
    payment_expectation_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentExpectationResponse(PaymentExpectationBase):
    """Schema for payment expectation responses."""
    id: int
    collaboration_id: int
    status: PaymentStatus
    created_at: datetime
    payment_credits: List[PaymentCreditResponse] = []
    
    class Config:
        from_attributes = True


class PaymentExpectationListResponse(BaseModel):
    """Schema for payment expectation list responses."""
    payment_expectations: List[PaymentExpectationResponse]
    total_count: int
    
    class Config:
        from_attributes = True


class OverduePaymentResponse(BaseModel):
    """Schema for overdue payment responses."""
    id: int
    collaboration_id: int
    collaboration_title: str
    brand_name: str
    expected_amount: Decimal
    promised_date: date
    days_overdue: int
    payment_method: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class OverduePaymentListResponse(BaseModel):
    """Schema for overdue payment list responses."""
    overdue_payments: List[OverduePaymentResponse]
    total_count: int
    
    class Config:
        from_attributes = True