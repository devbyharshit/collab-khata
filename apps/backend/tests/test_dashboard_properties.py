"""
Property-based tests for dashboard calculation functionality.

Feature: brand-collaboration-tracker
Properties: 17, 18, 19, 20
"""
import pytest
from hypothesis import given, strategies as st, assume, settings as hypothesis_settings, HealthCheck
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
import uuid

from app.models.user import User
from app.models.brand import Brand
from app.models.collaboration import Collaboration, CollaborationStatus
from app.models.payment import PaymentExpectation, PaymentCredit, PaymentStatus
from app.api.dashboard import _calculate_financial_summary, _get_collaboration_status_counts


class TestDashboardCalculationProperties:
    """Test dashboard calculation properties using property-based testing."""
    
    @given(
        collaboration_count=st.integers(min_value=1, max_value=5),
        payment_amounts=st.lists(
            st.decimals(min_value=Decimal('10.00'), max_value=Decimal('500.00'), places=2),
            min_size=1,
            max_size=3
        ),
        credit_ratios=st.lists(
            st.floats(min_value=0.0, max_value=1.0),
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
    async def test_property_17_financial_summary_calculations(
        self, collaboration_count, payment_amounts, credit_ratios, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 17: Financial summary calculations**
        
        For any user's dashboard, the financial summaries should accurately reflect the sum of all 
        payment expectations, credited amounts, and pending balances across all collaborations.
        
        **Validates: Requirements 7.1, 7.2**
        """
        # Ensure we have matching amounts and ratios
        assume(len(payment_amounts) == len(credit_ratios))
        
        # Create async session
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Create test user
            user = User(
                email=f"test_{uuid.uuid4()}@example.com",
                hashed_password="hashed_password"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Create brand
            brand = Brand(
                user_id=user.id,
                name=f"Test Brand {uuid.uuid4()}",
                contact_name="Test Contact"
            )
            session.add(brand)
            await session.commit()
            await session.refresh(brand)
            
            total_expected = Decimal('0')
            total_credited = Decimal('0')
            
            # Create collaborations with payment expectations and credits
            for i in range(collaboration_count):
                collaboration = Collaboration(
                    user_id=user.id,
                    brand_id=brand.id,
                    title=f"Test Collaboration {i}",
                    platform="Instagram",
                    status=CollaborationStatus.CONFIRMED
                )
                session.add(collaboration)
                await session.commit()
                await session.refresh(collaboration)
                
                # Create payment expectations for this collaboration
                for j, (amount, credit_ratio) in enumerate(zip(payment_amounts, credit_ratios)):
                    expectation = PaymentExpectation(
                        collaboration_id=collaboration.id,
                        expected_amount=amount,
                        promised_date=date.today() + timedelta(days=30),
                        status=PaymentStatus.PENDING
                    )
                    session.add(expectation)
                    await session.commit()
                    await session.refresh(expectation)
                    
                    total_expected += amount
                    
                    # Add partial credit based on ratio
                    if credit_ratio > 0:
                        credit_amount = (amount * Decimal(str(credit_ratio))).quantize(Decimal('0.01'))
                        credit = PaymentCredit(
                            payment_expectation_id=expectation.id,
                            credited_amount=credit_amount,
                            credited_date=date.today()
                        )
                        session.add(credit)
                        total_credited += credit_amount
                
                await session.commit()
            
            # Calculate financial summary using the API function
            financial_summary = await _calculate_financial_summary(user.id, session)
            
            # Verify calculations
            assert financial_summary.total_expected == total_expected
            assert financial_summary.total_credited == total_credited
            assert financial_summary.pending_amount == (total_expected - total_credited)
            assert financial_summary.currency == "USD"
    
    @given(
        promised_days_offsets=st.lists(
            st.integers(min_value=-30, max_value=30),
            min_size=1,
            max_size=5
        ),
        payment_statuses=st.lists(
            st.sampled_from([PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.COMPLETED]),
            min_size=1,
            max_size=5
        )
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_18_overdue_payment_identification(
        self, promised_days_offsets, payment_statuses, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 18: Overdue payment identification**
        
        For any payment expectation with a promised date in the past and status not Completed, 
        it should be identified and displayed as overdue.
        
        **Validates: Requirements 7.3**
        """
        # Ensure we have matching offsets and statuses
        assume(len(promised_days_offsets) == len(payment_statuses))
        
        # Create async session
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Create test user
            user = User(
                email=f"test_{uuid.uuid4()}@example.com",
                hashed_password="hashed_password"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Create brand
            brand = Brand(
                user_id=user.id,
                name=f"Test Brand {uuid.uuid4()}",
                contact_name="Test Contact"
            )
            session.add(brand)
            await session.commit()
            await session.refresh(brand)
            
            # Create collaboration
            collaboration = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title="Test Collaboration",
                platform="Instagram",
                status=CollaborationStatus.CONFIRMED
            )
            session.add(collaboration)
            await session.commit()
            await session.refresh(collaboration)
            
            expected_overdue_count = 0
            today = date.today()
            
            # Create payment expectations with various dates and statuses
            for offset, status in zip(promised_days_offsets, payment_statuses):
                promised_date = today + timedelta(days=offset)
                
                expectation = PaymentExpectation(
                    collaboration_id=collaboration.id,
                    expected_amount=Decimal('100.00'),
                    promised_date=promised_date,
                    status=status
                )
                session.add(expectation)
                
                # Count as overdue if date is in past and status is not completed
                if offset < 0 and status != PaymentStatus.COMPLETED:
                    expected_overdue_count += 1
            
            await session.commit()
            
            # Calculate financial summary to get overdue count
            financial_summary = await _calculate_financial_summary(user.id, session)
            
            # Verify overdue count matches expected
            assert financial_summary.overdue_count == expected_overdue_count
    
    @given(
        status_distribution=st.dictionaries(
            keys=st.sampled_from([status for status in CollaborationStatus]),
            values=st.integers(min_value=0, max_value=3),
            min_size=1,
            max_size=len(CollaborationStatus)
        )
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_19_collaboration_status_aggregation(
        self, status_distribution, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 19: Collaboration status aggregation**
        
        For any user's dashboard, the collaboration counts by status should accurately reflect 
        the current status distribution of all user's collaborations.
        
        **Validates: Requirements 7.4**
        """
        # Skip if no collaborations to create
        assume(sum(status_distribution.values()) > 0)
        
        # Create async session
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Create test user
            user = User(
                email=f"test_{uuid.uuid4()}@example.com",
                hashed_password="hashed_password"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Create brand
            brand = Brand(
                user_id=user.id,
                name=f"Test Brand {uuid.uuid4()}",
                contact_name="Test Contact"
            )
            session.add(brand)
            await session.commit()
            await session.refresh(brand)
            
            # Create collaborations with specified status distribution
            for status, count in status_distribution.items():
                for i in range(count):
                    collaboration = Collaboration(
                        user_id=user.id,
                        brand_id=brand.id,
                        title=f"Test Collaboration {status.value} {i}",
                        platform="Instagram",
                        status=status
                    )
                    session.add(collaboration)
            
            await session.commit()
            
            # Get status counts using the API function
            status_counts = await _get_collaboration_status_counts(user.id, session)
            
            # Convert to dictionary for easier comparison
            actual_counts = {item.status: item.count for item in status_counts}
            
            # Verify each status count matches expected
            for status, expected_count in status_distribution.items():
                if expected_count > 0:
                    assert actual_counts.get(status.value, 0) == expected_count
                else:
                    # Status should not appear in results if count is 0
                    assert status.value not in actual_counts
    
    @given(
        initial_amount=st.decimals(min_value=Decimal('50.00'), max_value=Decimal('200.00'), places=2),
        credit_amount=st.decimals(min_value=Decimal('10.00'), max_value=Decimal('100.00'), places=2)
    )
    @hypothesis_settings(
        max_examples=10,
        suppress_health_check=[HealthCheck.function_scoped_fixture],
        deadline=None
    )
    @pytest.mark.asyncio
    async def test_property_20_real_time_dashboard_updates(
        self, initial_amount, credit_amount, test_engine
    ):
        """
        **Feature: brand-collaboration-tracker, Property 20: Real-time dashboard updates**
        
        For any change to underlying collaboration or payment data, the dashboard calculations 
        should reflect the updated values immediately.
        
        **Validates: Requirements 7.5**
        """
        # Create async session
        async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Create test user
            user = User(
                email=f"test_{uuid.uuid4()}@example.com",
                hashed_password="hashed_password"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Create brand
            brand = Brand(
                user_id=user.id,
                name=f"Test Brand {uuid.uuid4()}",
                contact_name="Test Contact"
            )
            session.add(brand)
            await session.commit()
            await session.refresh(brand)
            
            # Create collaboration
            collaboration = Collaboration(
                user_id=user.id,
                brand_id=brand.id,
                title="Test Collaboration",
                platform="Instagram",
                status=CollaborationStatus.LEAD
            )
            session.add(collaboration)
            await session.commit()
            await session.refresh(collaboration)
            
            # Initial state - no payments
            initial_summary = await _calculate_financial_summary(user.id, session)
            initial_status_counts = await _get_collaboration_status_counts(user.id, session)
            
            assert initial_summary.total_expected == Decimal('0')
            assert initial_summary.total_credited == Decimal('0')
            assert len([sc for sc in initial_status_counts if sc.status == CollaborationStatus.LEAD.value]) == 1
            
            # Add payment expectation
            expectation = PaymentExpectation(
                collaboration_id=collaboration.id,
                expected_amount=initial_amount,
                promised_date=date.today() + timedelta(days=30),
                status=PaymentStatus.PENDING
            )
            session.add(expectation)
            await session.commit()
            await session.refresh(expectation)
            
            # Verify dashboard reflects new payment expectation
            after_expectation_summary = await _calculate_financial_summary(user.id, session)
            assert after_expectation_summary.total_expected == initial_amount
            assert after_expectation_summary.total_credited == Decimal('0')
            assert after_expectation_summary.pending_amount == initial_amount
            
            # Add payment credit
            credit = PaymentCredit(
                payment_expectation_id=expectation.id,
                credited_amount=credit_amount,
                credited_date=date.today()
            )
            session.add(credit)
            await session.commit()
            
            # Verify dashboard reflects new credit
            after_credit_summary = await _calculate_financial_summary(user.id, session)
            assert after_credit_summary.total_expected == initial_amount
            assert after_credit_summary.total_credited == credit_amount
            assert after_credit_summary.pending_amount == (initial_amount - credit_amount)
            
            # Update collaboration status
            collaboration.status = CollaborationStatus.CONFIRMED
            await session.commit()
            
            # Verify status counts reflect the change
            after_status_change_counts = await _get_collaboration_status_counts(user.id, session)
            confirmed_count = len([sc for sc in after_status_change_counts if sc.status == CollaborationStatus.CONFIRMED.value])
            lead_count = len([sc for sc in after_status_change_counts if sc.status == CollaborationStatus.LEAD.value])
            
            assert confirmed_count == 1
            assert lead_count == 0