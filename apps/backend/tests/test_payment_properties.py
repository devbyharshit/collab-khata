"""
Property-based tests for payment management functionality.

Feature: brand-collaboration-tracker
Properties: 14, 15, 16
"""
import pytest
from hypothesis import given, strategies as st, assume, settings as hypothesis_settings, HealthCheck
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus


class TestPaymentManagementProperties:
    """Test payment management properties using property-based testing."""
    
    @given(
        expected_amount=st.decimals(min_value=Decimal('0.01'), max_value=Decimal('1000.00'), places=2),
        credit_amounts=st.lists(
            st.decimals(min_value=Decimal('0.01'), max_value=Decimal('100.00'), places=2),
            min_size=1,
            max_size=3
        ),
        promised_days_offset=st.integers(min_value=-10, max_value=10)
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_14_payment_expectation_and_credit_relationship(
        self, expected_amount, credit_amounts, promised_days_offset, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 14: Payment expectation and credit relationship**
        
        For any payment expectation, adding credits should properly associate with the expectation 
        and update the remaining balance calculation.
        
        **Validates: Requirements 4.2, 4.4**
        """
        # Ensure total credits don't exceed expected amount for valid test
        total_credits = sum(credit_amounts)
        assume(total_credits <= expected_amount * 2)  # Allow some overpayment scenarios
        
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as db:
            # Create test user
            user = User(email=f"test_{uuid.uuid4().hex}@example.com", hashed_password="hashed")
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Create test brand
            brand = Brand(user_id=user.id, name="Test Brand")
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
            
            # Create test collaboration
            collaboration = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title="Test Collaboration",
                platform="Instagram",
                currency="USD",
                status=CollaborationStatus.CONFIRMED
            )
            db.add(collaboration)
            await db.commit()
            await db.refresh(collaboration)
            
            # Create payment expectation
            promised_date = date.today() + timedelta(days=promised_days_offset)
            expectation = PaymentExpectation(
                collaboration_id=collaboration.id,
                expected_amount=expected_amount,
                promised_date=promised_date,
                status=PaymentStatus.PENDING
            )
            db.add(expectation)
            await db.commit()
            await db.refresh(expectation)
            
            # Add credits one by one and verify relationships
            total_credited = Decimal('0.00')
            for i, credit_amount in enumerate(credit_amounts):
                # Don't add credit if it would exceed remaining balance by too much
                remaining_balance = expected_amount - total_credited
                if credit_amount > remaining_balance * Decimal('1.5'):
                    continue
                    
                credit = PaymentCredit(
                    payment_expectation_id=expectation.id,
                    credited_amount=credit_amount,
                    credited_date=date.today(),
                    reference_note=f"Credit {i+1}"
                )
                db.add(credit)
                await db.commit()
                await db.refresh(credit)
                
                # Verify credit is properly associated
                assert credit.payment_expectation_id == expectation.id
                assert credit.credited_amount == credit_amount
                
                total_credited += credit_amount
            
            # Refresh expectation with credits
            await db.refresh(expectation)
            result = await db.execute(
                select(PaymentExpectation)
                .options(selectinload(PaymentExpectation.payment_credits))
                .where(PaymentExpectation.id == expectation.id)
            )
            expectation_with_credits = result.scalar_one()
            
            # Verify relationship and balance calculation
            actual_total = sum(credit.credited_amount for credit in expectation_with_credits.payment_credits)
            assert actual_total == total_credited
            
            remaining_balance = expected_amount - total_credited
            assert remaining_balance == expected_amount - actual_total
    
    @given(
        expected_amount=st.decimals(min_value=Decimal('1.00'), max_value=Decimal('1000.00'), places=2),
        credit_scenario=st.sampled_from(['no_credits', 'partial_credits', 'full_credits', 'over_credits']),
        promised_days_offset=st.integers(min_value=-10, max_value=10)
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_15_payment_status_calculation(
        self, expected_amount, credit_scenario, promised_days_offset, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 15: Payment status calculation**
        
        For any payment expectation, the status should be calculated correctly: 
        Pending (no credits), Partial (credits < expected), Completed (credits >= expected), 
        Overdue (past promised date and not completed).
        
        **Validates: Requirements 4.3, 4.5**
        """
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as db:
            # Create test user
            user = User(email=f"test_{uuid.uuid4().hex}@example.com", hashed_password="hashed")
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Create test brand
            brand = Brand(user_id=user.id, name="Test Brand")
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
            
            # Create test collaboration
            collaboration = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title="Test Collaboration",
                platform="Instagram",
                currency="USD",
                status=CollaborationStatus.CONFIRMED
            )
            db.add(collaboration)
            await db.commit()
            await db.refresh(collaboration)
            
            # Create payment expectation
            promised_date = date.today() + timedelta(days=promised_days_offset)
            expectation = PaymentExpectation(
                collaboration_id=collaboration.id,
                expected_amount=expected_amount,
                promised_date=promised_date,
                status=PaymentStatus.PENDING
            )
            db.add(expectation)
            await db.commit()
            await db.refresh(expectation)
            
            # Add credits based on scenario
            if credit_scenario == 'no_credits':
                # No credits added
                pass
            elif credit_scenario == 'partial_credits':
                # Add partial credit (50% of expected)
                credit_amount = expected_amount * Decimal('0.5')
                credit = PaymentCredit(
                    payment_expectation_id=expectation.id,
                    credited_amount=credit_amount,
                    credited_date=date.today()
                )
                db.add(credit)
            elif credit_scenario == 'full_credits':
                # Add full credit (100% of expected)
                credit = PaymentCredit(
                    payment_expectation_id=expectation.id,
                    credited_amount=expected_amount,
                    credited_date=date.today()
                )
                db.add(credit)
            elif credit_scenario == 'over_credits':
                # Add over credit (120% of expected)
                credit_amount = expected_amount * Decimal('1.2')
                credit = PaymentCredit(
                    payment_expectation_id=expectation.id,
                    credited_amount=credit_amount,
                    credited_date=date.today()
                )
                db.add(credit)
            
            await db.commit()
            
            # Refresh expectation with credits
            result = await db.execute(
                select(PaymentExpectation)
                .options(selectinload(PaymentExpectation.payment_credits))
                .where(PaymentExpectation.id == expectation.id)
            )
            expectation_with_credits = result.scalar_one()
            
            # Calculate expected status
            total_credited = sum(credit.credited_amount for credit in expectation_with_credits.payment_credits)
            is_overdue = promised_date < date.today()
            
            if total_credited >= expected_amount:
                expected_status = PaymentStatus.COMPLETED
            elif total_credited > 0:
                expected_status = PaymentStatus.PARTIAL
            elif is_overdue:
                expected_status = PaymentStatus.OVERDUE
            else:
                expected_status = PaymentStatus.PENDING
            
            # Import and use the status update function
            from app.api.payments import _update_payment_status
            await _update_payment_status(expectation_with_credits, db)
            
            # Verify status calculation
            assert expectation_with_credits.status == expected_status
    
    @given(
        num_expectations=st.integers(min_value=1, max_value=3),
        amounts=st.lists(
            st.decimals(min_value=Decimal('10.00'), max_value=Decimal('500.00'), places=2),
            min_size=1,
            max_size=3
        )
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_16_multiple_payment_expectations_per_collaboration(
        self, num_expectations, amounts, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 16: Multiple payment expectations per collaboration**
        
        For any collaboration, multiple payment expectations should be properly associated 
        and managed independently.
        
        **Validates: Requirements 4.6**
        """
        # Ensure we have enough amounts for the expectations
        assume(len(amounts) >= num_expectations)
        
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as db:
            # Create test user
            user = User(email=f"test_{uuid.uuid4().hex}@example.com", hashed_password="hashed")
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Create test brand
            brand = Brand(user_id=user.id, name="Test Brand")
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
            
            # Create test collaboration
            collaboration = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title="Test Collaboration",
                platform="Instagram",
                currency="USD",
                status=CollaborationStatus.CONFIRMED
            )
            db.add(collaboration)
            await db.commit()
            await db.refresh(collaboration)
            
            # Create multiple payment expectations
            expectations = []
            for i in range(num_expectations):
                expectation = PaymentExpectation(
                    collaboration_id=collaboration.id,
                    expected_amount=amounts[i],
                    promised_date=date.today() + timedelta(days=i * 7),  # Different dates
                    payment_method=f"Method {i+1}",
                    notes=f"Payment {i+1}",
                    status=PaymentStatus.PENDING
                )
                db.add(expectation)
                expectations.append(expectation)
            
            await db.commit()
            
            # Refresh all expectations
            for expectation in expectations:
                await db.refresh(expectation)
            
            # Verify all expectations are properly associated with collaboration
            result = await db.execute(
                select(PaymentExpectation).where(
                    PaymentExpectation.collaboration_id == collaboration.id
                ).order_by(PaymentExpectation.created_at)
            )
            stored_expectations = result.scalars().all()
            
            assert len(stored_expectations) == num_expectations
            
            # Verify each expectation is independent and properly stored
            for i, expectation in enumerate(stored_expectations):
                assert expectation.collaboration_id == collaboration.id
                assert expectation.expected_amount == amounts[i]
                assert expectation.payment_method == f"Method {i+1}"
                assert expectation.notes == f"Payment {i+1}"
                assert expectation.status == PaymentStatus.PENDING
            
            # Add credits to some expectations and verify independence
            for i, expectation in enumerate(stored_expectations[:min(2, len(stored_expectations))]):
                credit = PaymentCredit(
                    payment_expectation_id=expectation.id,
                    credited_amount=amounts[i] * Decimal('0.5'),  # 50% credit
                    credited_date=date.today()
                )
                db.add(credit)
            
            await db.commit()
            
            # Verify that credits are associated with correct expectations
            for i, expectation in enumerate(stored_expectations):
                result = await db.execute(
                    select(PaymentCredit).where(
                        PaymentCredit.payment_expectation_id == expectation.id
                    )
                )
                credits = result.scalars().all()
                
                if i < min(2, len(stored_expectations)):
                    # Should have one credit
                    assert len(credits) == 1
                    assert credits[0].credited_amount == amounts[i] * Decimal('0.5')
                else:
                    # Should have no credits
                    assert len(credits) == 0