"""
Dashboard response schemas.
"""
from pydantic import BaseModel, Field
from typing import Dict, List
from decimal import Decimal


class CollaborationStatusCount(BaseModel):
    """Schema for collaboration status count."""
    status: str = Field(..., description="Collaboration status")
    count: int = Field(..., description="Number of collaborations with this status")


class FinancialSummary(BaseModel):
    """Schema for financial summary data."""
    total_expected: Decimal = Field(..., description="Total expected earnings across all collaborations")
    total_credited: Decimal = Field(..., description="Total amount credited/received")
    pending_amount: Decimal = Field(..., description="Total pending amount (expected - credited)")
    overdue_count: int = Field(..., description="Number of overdue payment expectations")
    currency: str = Field(default="INR", description="Currency for financial amounts")


class DashboardResponse(BaseModel):
    """Schema for dashboard API response."""
    financial_summary: FinancialSummary = Field(..., description="Financial overview data")
    collaboration_status_counts: List[CollaborationStatusCount] = Field(..., description="Collaboration counts by status")
    total_collaborations: int = Field(..., description="Total number of collaborations")
    
    class Config:
        from_attributes = True