import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'
import userEvent from '@testing-library/user-event'
import { PaymentCreditModal } from '../payment-credit-modal'
import { PaymentExpectation, PaymentStatus } from '@/types'

describe('PaymentCreditModal', () => {
  const mockOnSubmit = jest.fn()
  const mockOnOpenChange = jest.fn()

  const mockPaymentExpectation: PaymentExpectation = {
    id: 1,
    collaboration_id: 1,
    expected_amount: 10000,
    promised_date: '2024-12-31',
    payment_method: 'Bank Transfer',
    notes: 'Test payment',
    status: PaymentStatus.Pending,
    created_at: '2024-01-01T00:00:00Z',
    total_credited: 0,
  }

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    paymentExpectation: mockPaymentExpectation,
    currency: 'INR',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      expect(screen.getByText('Record Payment Credit')).toBeInTheDocument()
      expect(
        screen.getByText(/Record a payment received for this expectation/i)
      ).toBeInTheDocument()
    })

    it('should not render when paymentExpectation is null', () => {
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={null} />)

      expect(screen.queryByText('Record Payment Credit')).not.toBeInTheDocument()
    })

    it('should display payment summary', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      expect(screen.getByText('Expected Amount')).toBeInTheDocument()
      expect(screen.getAllByText('₹10,000')).toHaveLength(2) // Expected and Remaining
      expect(screen.getByText('Remaining Balance')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should display already credited amount when present', () => {
      const partialPayment = {
        ...mockPaymentExpectation,
        total_credited: 3000,
        status: PaymentStatus.Partial,
      }
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={partialPayment} />)

      expect(screen.getByText('Already Credited')).toBeInTheDocument()
      expect(screen.getByText('₹3,000')).toBeInTheDocument()
      expect(screen.getByText('₹7,000')).toBeInTheDocument() // Remaining balance
    })

    it('should display all form fields', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      expect(screen.getByLabelText(/Credited Amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Credited Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Reference Note/i)).toBeInTheDocument()
    })
  })

  describe('Balance Calculations', () => {
    it('should calculate remaining balance correctly', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const balanceElements = screen.getAllByText('₹10,000')
      expect(balanceElements.length).toBeGreaterThanOrEqual(1) // Remaining balance
    })

    it('should calculate remaining balance with partial payment', () => {
      const partialPayment = {
        ...mockPaymentExpectation,
        total_credited: 4000,
      }
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={partialPayment} />)

      expect(screen.getByText('₹6,000')).toBeInTheDocument() // Remaining balance
    })

    it('should show new balance after credit when amount is entered', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '3000')

      await waitFor(() => {
        expect(screen.getByText('New Balance After Credit')).toBeInTheDocument()
        expect(screen.getByText('₹7,000')).toBeInTheDocument()
      })
    })

    it('should show completion message when full payment is entered', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '10000')

      await waitFor(() => {
        expect(screen.getByText(/Payment will be marked as completed/i)).toBeInTheDocument()
      })
    })

    it('should show partial payment message when partial amount is entered', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      await waitFor(() => {
        expect(screen.getByText(/Payment will be marked as partial/i)).toBeInTheDocument()
      })
    })

    it('should handle overpayment correctly', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '15000')

      await waitFor(() => {
        expect(screen.getByText('₹0')).toBeInTheDocument() // New balance capped at 0
        expect(screen.getByText(/Payment will be marked as completed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should show error when amount is 0', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when amount is negative', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '-100')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when date is empty', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      const dateInput = screen.getByLabelText(/Credited Date/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')
      await userEvent.clear(dateInput)

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Date is required')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      const dateInput = screen.getByLabelText(/Credited Date/i)
      const referenceInput = screen.getByLabelText(/Reference Note/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')
      await userEvent.clear(dateInput)
      await userEvent.type(dateInput, '2024-06-15')
      await userEvent.type(referenceInput, 'TXN123456')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          credited_amount: 5000,
          credited_date: '2024-06-15',
          reference_note: 'TXN123456',
        })
      })
    })

    it('should call onSubmit without reference note when not provided', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      const dateInput = screen.getByLabelText(/Credited Date/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')
      await userEvent.clear(dateInput)
      await userEvent.type(dateInput, '2024-06-15')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            credited_amount: 5000,
            credited_date: '2024-06-15',
            reference_note: '',
          })
        )
      })
    })

    it('should close modal after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should show submitting state during submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      resolveSubmit!()
    })

    it('should disable form fields during submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Record Credit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(amountInput).toBeDisabled()
        expect(screen.getByLabelText(/Credited Date/i)).toBeDisabled()
        expect(screen.getByLabelText(/Reference Note/i)).toBeDisabled()
      })

      resolveSubmit!()
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal is closed', async () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      const referenceInput = screen.getByLabelText(/Reference Note/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')
      await userEvent.type(referenceInput, 'TXN123')

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should initialize with current date', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const dateInput = screen.getByLabelText(/Credited Date/i) as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]

      expect(dateInput.value).toBe(today)
    })

    it('should reset form when payment expectation changes', () => {
      const { rerender } = render(<PaymentCreditModal {...defaultProps} />)

      const newPayment = {
        ...mockPaymentExpectation,
        id: 2,
        expected_amount: 20000,
      }

      rerender(<PaymentCreditModal {...defaultProps} paymentExpectation={newPayment} />)

      const balanceElements = screen.getAllByText('₹20,000')
      expect(balanceElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Payment Status Display', () => {
    it('should display Pending status correctly', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const statusBadge = screen.getByText('Pending')
      expect(statusBadge).toHaveClass('bg-gray-50', 'text-gray-700')
    })

    it('should display Partial status correctly', () => {
      const partialPayment = {
        ...mockPaymentExpectation,
        status: PaymentStatus.Partial,
        total_credited: 3000,
      }
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={partialPayment} />)

      const statusBadge = screen.getByText('Partial')
      expect(statusBadge).toHaveClass('bg-yellow-50', 'text-yellow-700')
    })

    it('should display Overdue status correctly', () => {
      const overduePayment = {
        ...mockPaymentExpectation,
        status: PaymentStatus.Overdue,
      }
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={overduePayment} />)

      const statusBadge = screen.getByText('Overdue')
      expect(statusBadge).toHaveClass('bg-red-50', 'text-red-700')
    })

    it('should display Completed status correctly', () => {
      const completedPayment = {
        ...mockPaymentExpectation,
        status: PaymentStatus.Completed,
        total_credited: 10000,
      }
      render(<PaymentCreditModal {...defaultProps} paymentExpectation={completedPayment} />)

      const statusBadge = screen.getByText('Completed')
      expect(statusBadge).toHaveClass('bg-green-50', 'text-green-700')
    })
  })

  describe('Mobile Optimization', () => {
    it('should have large touch targets for buttons', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      const submitButton = screen.getByRole('button', { name: /Record Credit/i })

      expect(cancelButton).toHaveClass('h-12')
      expect(submitButton).toHaveClass('h-12')
    })

    it('should have large input fields', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Credited Amount/i)
      const dateInput = screen.getByLabelText(/Credited Date/i)
      const referenceInput = screen.getByLabelText(/Reference Note/i)

      expect(amountInput).toHaveClass('h-12')
      expect(dateInput).toHaveClass('h-12')
      expect(referenceInput).toHaveClass('h-12')
    })
  })

  describe('Cancel Button', () => {
    it('should call onOpenChange when cancel is clicked', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should not call onSubmit when cancel is clicked', () => {
      render(<PaymentCreditModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })
})
