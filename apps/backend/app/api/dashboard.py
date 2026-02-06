"""
Dashboard API endpoints for financial summaries and statistics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import date
from decimal import Decimal

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus
from app.schemas.dashboard import (
    DashboardResponse,
    FinancialSummary,
    CollaborationStatusCount
)


router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard financial summaries and statistics for the current user."""
    
    # Calculate financial summary
    financial_summary = await _calculate_financial_summary(current_user.id, db)
    
    # Get collaboration status counts
    status_counts = await _get_collaboration_status_counts(current_user.id, db)
    
    # Get total collaboration count
    total_collaborations_result = await db.execute(
        select(func.count(Collaboration.id)).where(
            Collaboration.user_id == current_user.id
        )
    )
    total_collaborations = total_collaborations_result.scalar() or 0
    
    return DashboardResponse(
        financial_summary=financial_summary,
        collaboration_status_counts=status_counts,
        total_collaborations=total_collaborations
    )


async def _calculate_financial_summary(user_id: int, db: AsyncSession) -> FinancialSummary:
    """Calculate financial summary for a user."""
    
    # Get total expected earnings across all collaborations
    total_expected_result = await db.execute(
        select(func.coalesce(func.sum(PaymentExpectation.expected_amount), 0))
        .join(Collaboration, PaymentExpectation.collaboration_id == Collaboration.id)
        .where(Collaboration.user_id == user_id)
    )
    total_expected = total_expected_result.scalar() or Decimal('0')
    
    # Get total credited amount
    total_credited_result = await db.execute(
        select(func.coalesce(func.sum(PaymentCredit.credited_amount), 0))
        .join(PaymentExpectation, PaymentCredit.payment_expectation_id == PaymentExpectation.id)
        .join(Collaboration, PaymentExpectation.collaboration_id == Collaboration.id)
        .where(Collaboration.user_id == user_id)
    )
    total_credited = total_credited_result.scalar() or Decimal('0')
    
    # Calculate pending amount
    pending_amount = total_expected - total_credited
    
    # Count overdue payment expectations
    today = date.today()
    overdue_count_result = await db.execute(
        select(func.count(PaymentExpectation.id))
        .join(Collaboration, PaymentExpectation.collaboration_id == Collaboration.id)
        .where(
            and_(
                Collaboration.user_id == user_id,
                PaymentExpectation.promised_date.is_not(None),
                PaymentExpectation.promised_date < today,
                PaymentExpectation.status.in_([
                    PaymentStatus.PENDING, 
                    PaymentStatus.PARTIAL, 
                    PaymentStatus.OVERDUE
                ])
            )
        )
    )
    overdue_count = overdue_count_result.scalar() or 0
    
    return FinancialSummary(
        total_expected=total_expected,
        total_credited=total_credited,
        pending_amount=pending_amount,
        overdue_count=overdue_count,
        currency="USD"
    )


async def _get_collaboration_status_counts(user_id: int, db: AsyncSession) -> List[CollaborationStatusCount]:
    """Get collaboration counts by status for a user."""
    
    # Query collaboration status counts
    status_counts_result = await db.execute(
        select(
            Collaboration.status,
            func.count(Collaboration.id).label('count')
        )
        .where(Collaboration.user_id == user_id)
        .group_by(Collaboration.status)
        .order_by(Collaboration.status)
    )
    
    status_counts_data = status_counts_result.all()
    
    # Convert to response objects
    status_counts = []
    for status, count in status_counts_data:
        status_counts.append(CollaborationStatusCount(
            status=status.value,  # Convert enum to string value
            count=count
        ))
    
    return status_counts