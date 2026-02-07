# Payment Management Modals

This document describes the payment management modal components created for the Collab Khata application.

## Components

### PaymentExpectationModal

A modal component for adding payment expectations to collaborations.

**Features:**
- Form validation for amount (required, must be > 0)
- Optional fields: promised date, payment method, notes
- Mobile-optimized with large touch targets (h-12)
- Automatic form reset on open/close
- Loading states during submission

**Usage:**

```tsx
import { PaymentExpectationModal } from '@/components/payment-expectation-modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (data: PaymentExpectationCreateRequest) => {
    await apiClient.post(`/api/collaborations/${id}/payments`, data)
    // Refresh data
  }

  return (
    <PaymentExpectationModal
      open={isOpen}
      onOpenChange={setIsOpen}
      onSubmit={handleSubmit}
      currency="INR"
    />
  )
}
```

### PaymentCreditModal

A modal component for recording payment credits (actual payments received).

**Features:**
- Real-time balance calculation display
- Support for partial payments
- Visual indicators for payment completion status
- Form validation for amount and date
- Mobile-optimized with large touch targets (h-12)
- Automatic form reset with current date default

**Usage:**

```tsx
import { PaymentCreditModal } from '@/components/payment-credit-modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentExpectation | null>(null)

  const handleSubmit = async (data: PaymentCreditCreateRequest) => {
    await apiClient.post(`/api/payments/${selectedPayment.id}/credits`, data)
    // Refresh data
  }

  return (
    <PaymentCreditModal
      open={isOpen}
      onOpenChange={setIsOpen}
      onSubmit={handleSubmit}
      paymentExpectation={selectedPayment}
      currency="INR"
    />
  )
}
```

## Testing

Both components have comprehensive unit tests covering:
- Rendering and display
- Form validation
- Form submission
- Balance calculations (PaymentCreditModal)
- Mobile optimization
- Error handling
- Form reset behavior

Run tests:
```bash
npm test -- payment-expectation-modal.test.tsx
npm test -- payment-credit-modal.test.tsx
```

## Mobile Optimization

Both modals follow mobile-first design principles:
- Large touch targets (h-12 for buttons and inputs)
- Responsive layouts (full width on mobile, auto width on desktop)
- Clear visual hierarchy
- Accessible form labels with required field indicators

## Integration

These modals can be integrated into the collaboration detail page or any other page that needs payment management functionality. They are designed to be reusable and self-contained.

Example integration in collaboration detail page:

```tsx
// Import the modals
import { PaymentExpectationModal } from '@/components/payment-expectation-modal'
import { PaymentCreditModal } from '@/components/payment-credit-modal'

// Add state
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
const [isCreditModalOpen, setIsCreditModalOpen] = useState(false)
const [selectedPayment, setSelectedPayment] = useState<PaymentExpectation | null>(null)

// Add handlers
const handleCreatePayment = async (data: PaymentExpectationCreateRequest) => {
  await apiClient.post(`/api/collaborations/${collaborationId}/payments`, data)
  fetchCollaborationDetails()
}

const handleCreateCredit = async (data: PaymentCreditCreateRequest) => {
  if (!selectedPayment) return
  await apiClient.post(`/api/payments/${selectedPayment.id}/credits`, data)
  fetchCollaborationDetails()
}

// Render modals
<PaymentExpectationModal
  open={isPaymentModalOpen}
  onOpenChange={setIsPaymentModalOpen}
  onSubmit={handleCreatePayment}
  currency={collaboration.currency}
/>

<PaymentCreditModal
  open={isCreditModalOpen}
  onOpenChange={setIsCreditModalOpen}
  onSubmit={handleCreateCredit}
  paymentExpectation={selectedPayment}
  currency={collaboration.currency}
/>
```
