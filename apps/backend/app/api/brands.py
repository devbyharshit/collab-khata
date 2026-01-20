"""
Brand management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse


router = APIRouter(prefix="/api/brands", tags=["brands"])


@router.get("/", response_model=List[BrandResponse])
async def list_brands(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all brands for the authenticated user."""
    result = await db.execute(
        select(Brand).where(Brand.user_id == current_user.id).order_by(Brand.created_at.desc())
    )
    brands = result.scalars().all()
    return brands


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    brand_data: BrandCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new brand for the authenticated user."""
    # Validate required fields
    if not brand_data.name or not brand_data.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand name is required"
        )
    
    # Create new brand
    new_brand = Brand(
        user_id=current_user.id,
        name=brand_data.name.strip(),
        contact_name=brand_data.contact_name.strip() if brand_data.contact_name else None,
        contact_email=brand_data.contact_email.strip() if brand_data.contact_email else None,
        contact_channel=brand_data.contact_channel.strip() if brand_data.contact_channel else None,
        notes=brand_data.notes.strip() if brand_data.notes else None
    )
    
    db.add(new_brand)
    await db.commit()
    await db.refresh(new_brand)
    return new_brand


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific brand by ID for the authenticated user."""
    result = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.user_id == current_user.id)
    )
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    
    return brand


@router.put("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a specific brand for the authenticated user."""
    # Get existing brand
    result = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.user_id == current_user.id)
    )
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    
    # Update fields that are provided
    update_data = brand_data.model_dump(exclude_unset=True)
    
    # Validate name if provided
    if 'name' in update_data:
        if not update_data['name'] or not update_data['name'].strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Brand name cannot be empty"
            )
        update_data['name'] = update_data['name'].strip()
    
    # Strip whitespace from string fields
    for field in ['contact_name', 'contact_email', 'contact_channel', 'notes']:
        if field in update_data and update_data[field] is not None:
            update_data[field] = update_data[field].strip() if update_data[field] else None
    
    # Apply updates
    for field, value in update_data.items():
        setattr(brand, field, value)
    
    await db.commit()
    await db.refresh(brand)
    return brand