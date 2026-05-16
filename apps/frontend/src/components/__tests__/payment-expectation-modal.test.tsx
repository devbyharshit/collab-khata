import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'
import userEvent from '@testing-library/user-event'
import { PaymentExpectationModal } from '../payment-expectation-modal'
import { PaymentExpectationCreateRequest } from '@/types'

describe('PaymentExpectationModal', () => {
  const mockOnSubmit = jest.fn()
  const mockOnOpenChange = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    currency: 'INR',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      expect(screen.getByText('Add Payment Expectation')).toBeInTheDocument()
      expect(
        screen.getByText('Record an expected payment for this collaboration.')
      ).toBeInTheDocument()
    })

    it('should display all form fields', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      expect(screen.getByLabelText(/Expected Amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Promised Date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()
    })

    it('should display currency in amount label', () => {
      render(<PaymentExpectationModal {...defaultProps} currency="USD" />)

      expect(screen.getByText(/Expected Amount \(USD\)/i)).toBeInTheDocument()
    })

    it('should have Cancel and Add Payment buttons', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Add Payment/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when amount is 0', async () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when amount is negative', async () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '-100')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not show error when amount is valid', async () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Amount must be greater than 0')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      const dateInput = screen.getByLabelText(/Promised Date/i)
      const methodInput = screen.getByLabelText(/Payment Method/i)
      const notesInput = screen.getByLabelText(/Notes/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '10000')
      await userEvent.type(dateInput, '2024-12-31')
      await userEvent.type(methodInput, 'Bank Transfer')
      await userEvent.type(notesInput, 'First milestone payment')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          expected_amount: 10000,
          promised_date: '2024-12-31',
          payment_method: 'Bank Transfer',
          notes: 'First milestone payment',
        })
      })
    })

    it('should call onSubmit with minimal data when optional fields are empty', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          expected_amount: 5000,
          promised_date: '',
          payment_method: '',
          notes: '',
        })
      })
    })

    it('should close modal after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
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

      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument()
      })

      resolveSubmit!()
    })

    it('should disable form fields during submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(amountInput).toBeDisabled()
        expect(screen.getByLabelText(/Promised Date/i)).toBeDisabled()
        expect(screen.getByLabelText(/Payment Method/i)).toBeDisabled()
        expect(screen.getByLabelText(/Notes/i)).toBeDisabled()
      })

      resolveSubmit!()
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal is closed', async () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      const methodInput = screen.getByLabelText(/Payment Method/i)

      await userEvent.clear(amountInput)
      await userEvent.type(amountInput, '5000')
      await userEvent.type(methodInput, 'UPI')

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should clear errors when modal is reopened', async () => {
      const { rerender } = render(<PaymentExpectationModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Add Payment/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      })

      // Close and reopen modal
      rerender(<PaymentExpectationModal {...defaultProps} open={false} />)
      rerender(<PaymentExpectationModal {...defaultProps} open={true} />)

      expect(screen.queryByText('Amount must be greater than 0')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Optimization', () => {
    it('should have large touch targets for buttons', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      const submitButton = screen.getByRole('button', { name: /Add Payment/i })

      expect(cancelButton).toHaveClass('h-12')
      expect(submitButton).toHaveClass('h-12')
    })

    it('should have large input fields', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const amountInput = screen.getByLabelText(/Expected Amount/i)
      const dateInput = screen.getByLabelText(/Promised Date/i)
      const methodInput = screen.getByLabelText(/Payment Method/i)

      expect(amountInput).toHaveClass('h-12')
      expect(dateInput).toHaveClass('h-12')
      expect(methodInput).toHaveClass('h-12')
    })
  })

  describe('Cancel Button', () => {
    it('should call onOpenChange when cancel is clicked', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should not call onSubmit when cancel is clicked', () => {
      render(<PaymentExpectationModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })
})
