"""
Payment management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import date, datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.collaboration import Collaboration
from app.models.brand import Brand
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus
from app.schemas.payment import (
    PaymentExpectationCreate,
    PaymentExpectationUpdate,
    PaymentExpectationResponse,
    PaymentExpectationListResponse,
    PaymentCreditCreate,
    PaymentCreditResponse,
    OverduePaymentResponse,
    OverduePaymentListResponse
)


router = APIRouter(prefix="/api", tags=["payments"])


@router.get("/collaborations/{collaboration_id}/payments", response_model=PaymentExpectationListResponse)
async def list_payment_expectations(
    collaboration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List payment expectations for a specific collaboration."""
    
    # Verify collaboration belongs to current user
    collaboration_result = await db.execute(
        select(Collaboration).where(
            Collaboration.id == collaboration_id,
            Collaboration.user_id == current_user.id
        )
    )
    collaboration = collaboration_result.scalar_one_or_none()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Get payment expectations with credits
    query = select(PaymentExpectation).options(
        selectinload(PaymentExpectation.payment_credits)
    ).where(PaymentExpectation.collaboration_id == collaboration_id).order_by(PaymentExpectation.created_at)
    
    result = await db.execute(query)
    payment_expectations = result.scalars().all()
    
    # Update payment statuses based on current data
    for expectation in payment_expectations:
        await _update_payment_status(expectation, db)
    
    # Get total count
    count_result = await db.execute(
        select(func.count(PaymentExpectation.id)).where(
            PaymentExpectation.collaboration_id == collaboration_id
        )
    )
    total_count = count_result.scalar()
    
    return PaymentExpectationListResponse(
        payment_expectations=payment_expectations,
        total_count=total_count
    )


@router.post("/collaborations/{collaboration_id}/payments", response_model=PaymentExpectationResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_expectation(
    collaboration_id: int,
    payment_data: PaymentExpectationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new payment expectation for a collaboration."""
    
    # Verify collaboration belongs to current user
    collaboration_result = await db.execute(
        select(Collaboration).where(
            Collaboration.id == collaboration_id,
            Collaboration.user_id == current_user.id
        )
    )
    collaboration = collaboration_result.scalar_one_or_none()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Create new payment expectation
    new_expectation = PaymentExpectation(
        collaboration_id=collaboration_id,
        expected_amount=payment_data.expected_amount,
        promised_date=payment_data.promised_date,
        payment_method=payment_data.payment_method,
        notes=payment_data.notes,
        status=PaymentStatus.PENDING
    )
    
    db.add(new_expectation)
    await db.commit()
    await db.refresh(new_expectation)
    
    # Update status based on promised date
    await _update_payment_status(new_expectation, db)
    
    return new_expectation


@router.post("/payments/{payment_id}/credits", response_model=PaymentCreditResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_credit(
    payment_id: int,
    credit_data: PaymentCreditCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a payment credit for a payment expectation."""
    
    # Get payment expectation and verify ownership through collaboration
    expectation_result = await db.execute(
        select(PaymentExpectation)
        .join(Collaboration)
        .where(
            PaymentExpectation.id == payment_id,
            Collaboration.user_id == current_user.id
        )
        .options(selectinload(PaymentExpectation.payment_credits))
    )
    expectation = expectation_result.scalar_one_or_none()
    
    if not expectation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment expectation not found"
        )
    
    # Validate that credit amount doesn't exceed remaining balance
    total_credited = sum(credit.credited_amount for credit in expectation.payment_credits)
    remaining_balance = expectation.expected_amount - total_credited
    
    if credit_data.credited_amount > remaining_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Credit amount ({credit_data.credited_amount}) exceeds remaining balance ({remaining_balance})"
        )
    
    # Create new payment credit
    new_credit = PaymentCredit(
        payment_expectation_id=payment_id,
        credited_amount=credit_data.credited_amount,
        credited_date=credit_data.credited_date,
        reference_note=credit_data.reference_note
    )
    
    db.add(new_credit)
    await db.commit()
    await db.refresh(new_credit)
    
    # Update payment expectation status
    await db.refresh(expectation)
    await _update_payment_status(expectation, db)
    
    return new_credit


@router.get("/payments/overdue", response_model=OverduePaymentListResponse)
async def list_overdue_payments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all overdue payment expectations for the current user."""
    
    today = date.today()
    
    # Query for overdue payments with collaboration and brand details
    query = select(
        PaymentExpectation,
        Collaboration.title.label('collaboration_title'),
        Brand.name.label('brand_name')
    ).join(
        Collaboration, PaymentExpectation.collaboration_id == Collaboration.id
    ).join(
        Brand, Collaboration.brand_id == Brand.id
    ).where(
        and_(
            Collaboration.user_id == current_user.id,
            PaymentExpectation.promised_date.is_not(None),
            PaymentExpectation.promised_date < today,
            PaymentExpectation.status.in_([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE])
        )
    ).order_by(PaymentExpectation.promised_date)
    
    result = await db.execute(query)
    overdue_data = result.all()
    
    # Build response objects
    overdue_payments = []
    for expectation, collaboration_title, brand_name in overdue_data:
        # Update status to overdue if needed
        await _update_payment_status(expectation, db)
        
        days_overdue = (today - expectation.promised_date).days
        
        overdue_payment = OverduePaymentResponse(
            id=expectation.id,
            collaboration_id=expectation.collaboration_id,
            collaboration_title=collaboration_title,
            brand_name=brand_name,
            expected_amount=expectation.expected_amount,
            promised_date=expectation.promised_date,
            days_overdue=days_overdue,
            payment_method=expectation.payment_method,
            notes=expectation.notes
        )
        overdue_payments.append(overdue_payment)
    
    return OverduePaymentListResponse(
        overdue_payments=overdue_payments,
        total_count=len(overdue_payments)
    )


async def _update_payment_status(expectation: PaymentExpectation, db: AsyncSession) -> None:
    """Update payment expectation status based on credits and dates."""
    
    # Calculate total credited amount
    total_credited = sum(credit.credited_amount for credit in expectation.payment_credits)
    
    # Determine new status
    new_status = expectation.status
    
    if total_credited >= expectation.expected_amount:
        new_status = PaymentStatus.COMPLETED
    elif total_credited > 0:
        new_status = PaymentStatus.PARTIAL
    elif expectation.promised_date and expectation.promised_date < date.today():
        new_status = PaymentStatus.OVERDUE
    else:
        new_status = PaymentStatus.PENDING
    
    # Update status if changed
    if new_status != expectation.status:
        expectation.status = new_status
        await db.commit()