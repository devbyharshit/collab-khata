"""
Collaboration management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.schemas.collaboration import (
    CollaborationCreate, 
    CollaborationUpdate, 
    CollaborationStatusUpdate,
    CollaborationResponse, 
    CollaborationListResponse
)


router = APIRouter(prefix="/api/collaborations", tags=["collaborations"])


@router.get("/", response_model=CollaborationListResponse)
async def list_collaborations(
    status_filter: Optional[CollaborationStatus] = Query(None, description="Filter by collaboration status"),
    brand_id: Optional[int] = Query(None, description="Filter by brand ID"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List collaborations for the authenticated user with filtering capabilities."""
    
    # Build base query
    query = select(Collaboration).where(Collaboration.user_id == current_user.id)
    count_query = select(func.count(Collaboration.id)).where(Collaboration.user_id == current_user.id)
    
    # Apply filters
    filters = []
    if status_filter:
        filters.append(Collaboration.status == status_filter)
    if brand_id:
        filters.append(Collaboration.brand_id == brand_id)
    if platform:
        filters.append(Collaboration.platform.ilike(f"%{platform}%"))
    
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    
    # Get total count
    total_result = await db.execute(select(func.count(Collaboration.id)).where(Collaboration.user_id == current_user.id))
    total_count = total_result.scalar()
    
    # Get filtered count
    filtered_result = await db.execute(count_query)
    filtered_count = filtered_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Collaboration.updated_at.desc()).offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    collaborations = result.scalars().all()
    
    return CollaborationListResponse(
        collaborations=collaborations,
        total_count=total_count,
        filtered_count=filtered_count
    )


@router.post("/", response_model=CollaborationResponse, status_code=status.HTTP_201_CREATED)
async def create_collaboration(
    collaboration_data: CollaborationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new collaboration for the authenticated user."""
    
    # Validate that the brand belongs to the current user
    brand_result = await db.execute(
        select(Brand).where(Brand.id == collaboration_data.brand_id, Brand.user_id == current_user.id)
    )
    brand = brand_result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand not found or does not belong to the current user"
        )
    
    # Create new collaboration
    new_collaboration = Collaboration(
        user_id=current_user.id,
        brand_id=collaboration_data.brand_id,
        title=collaboration_data.title.strip(),
        platform=collaboration_data.platform.strip(),
        deliverables_text=collaboration_data.deliverables_text.strip() if collaboration_data.deliverables_text else None,
        agreed_amount=collaboration_data.agreed_amount,
        currency=collaboration_data.currency.upper(),
        deadline_date=collaboration_data.deadline_date,
        status=CollaborationStatus.LEAD  # Always start with Lead status
    )
    
    db.add(new_collaboration)
    await db.commit()
    await db.refresh(new_collaboration)
    return new_collaboration


@router.get("/{collaboration_id}", response_model=CollaborationResponse)
async def get_collaboration(
    collaboration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific collaboration by ID for the authenticated user."""
    result = await db.execute(
        select(Collaboration).where(
            Collaboration.id == collaboration_id, 
            Collaboration.user_id == current_user.id
        )
    )
    collaboration = result.scalar_one_or_none()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    return collaboration


@router.put("/{collaboration_id}", response_model=CollaborationResponse)
async def update_collaboration(
    collaboration_id: int,
    collaboration_data: CollaborationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a specific collaboration for the authenticated user."""
    
    # Get existing collaboration
    result = await db.execute(
        select(Collaboration).where(
            Collaboration.id == collaboration_id, 
            Collaboration.user_id == current_user.id
        )
    )
    collaboration = result.scalar_one_or_none()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Get update data
    update_data = collaboration_data.model_dump(exclude_unset=True)
    
    # Validate brand_id if provided
    if 'brand_id' in update_data:
        brand_result = await db.execute(
            select(Brand).where(Brand.id == update_data['brand_id'], Brand.user_id == current_user.id)
        )
        brand = brand_result.scalar_one_or_none()
        
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Brand not found or does not belong to the current user"
            )
    
    # Strip whitespace from string fields
    for field in ['title', 'platform', 'deliverables_text']:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip() if update_data[field] else None
    
    # Uppercase currency if provided
    if 'currency' in update_data and update_data['currency']:
        update_data['currency'] = update_data['currency'].upper()
    
    # Apply updates
    for field, value in update_data.items():
        setattr(collaboration, field, value)
    
    await db.commit()
    await db.refresh(collaboration)
    return collaboration


@router.patch("/{collaboration_id}/status", response_model=CollaborationResponse)
async def update_collaboration_status(
    collaboration_id: int,
    status_data: CollaborationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update collaboration status with workflow validation."""
    
    # Get existing collaboration
    result = await db.execute(
        select(Collaboration).where(
            Collaboration.id == collaboration_id, 
            Collaboration.user_id == current_user.id
        )
    )
    collaboration = result.scalar_one_or_none()
    
    if not collaboration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaboration not found"
        )
    
    # Define valid status transitions
    valid_transitions = {
        CollaborationStatus.LEAD: [CollaborationStatus.NEGOTIATING],
        CollaborationStatus.NEGOTIATING: [CollaborationStatus.CONFIRMED, CollaborationStatus.LEAD],
        CollaborationStatus.CONFIRMED: [CollaborationStatus.IN_PRODUCTION, CollaborationStatus.NEGOTIATING],
        CollaborationStatus.IN_PRODUCTION: [CollaborationStatus.POSTED, CollaborationStatus.CONFIRMED],
        CollaborationStatus.POSTED: [CollaborationStatus.PAYMENT_PENDING, CollaborationStatus.IN_PRODUCTION],
        CollaborationStatus.PAYMENT_PENDING: [CollaborationStatus.OVERDUE, CollaborationStatus.PAID],
        CollaborationStatus.OVERDUE: [CollaborationStatus.PAID, CollaborationStatus.PAYMENT_PENDING],
        CollaborationStatus.PAID: [CollaborationStatus.CLOSED],
        CollaborationStatus.CLOSED: []  # Terminal state
    }
    
    # Validate status transition
    current_status = collaboration.status
    new_status = status_data.status
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from {current_status.value} to {new_status.value}"
        )
    
    # Special validation for Posted status - requires posting_date
    if new_status == CollaborationStatus.POSTED:
        if not status_data.posting_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Posting date is required when setting status to Posted"
            )
        collaboration.posting_date = status_data.posting_date
    
    # Update status
    collaboration.status = new_status
    
    await db.commit()
    await db.refresh(collaboration)
    return collaboration