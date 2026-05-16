import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'
import userEvent from '@testing-library/user-event'
import { ConversationLogModal } from '../conversation-log-modal'
import { CommunicationChannel } from '@/types'

describe('ConversationLogModal', () => {
  const mockOnSubmit = jest.fn()
  const mockOnOpenChange = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<ConversationLogModal {...defaultProps} />)

      expect(screen.getByText('Add Conversation Log')).toBeInTheDocument()
      expect(
        screen.getByText('Record a conversation or communication with the brand.')
      ).toBeInTheDocument()
    })

    it('should display all form fields', () => {
      render(<ConversationLogModal {...defaultProps} />)

      expect(screen.getByLabelText(/Communication Channel/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Message/i)).toBeInTheDocument()
    })

    it('should have Cancel and Add Conversation buttons', () => {
      render(<ConversationLogModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Add Conversation/i })).toBeInTheDocument()
    })

    it('should default to Email channel', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const channelSelect = screen.getByRole('combobox')
      expect(channelSelect).toHaveTextContent('Email')
    })
  })

  describe('Channel Selection', () => {
    it('should have a channel select dropdown', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const channelSelect = screen.getByRole('combobox')
      expect(channelSelect).toBeInTheDocument()
      expect(channelSelect).toHaveTextContent('Email')
    })
  })

  describe('Form Validation', () => {
    it('should show error when message is empty', async () => {
      render(<ConversationLogModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Message text is required')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should show error when message is only whitespace', async () => {
      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, '   ')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Message text is required')).toBeInTheDocument()
      })
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not show error when message is valid', async () => {
      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Discussed campaign details')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Message text is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with default Email channel', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Initial outreach email sent')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          channel: CommunicationChannel.Email,
          message_text: 'Initial outreach email sent',
        })
      })
    })

    it('should close modal after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      
      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Test message')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

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

      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Test message')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument()
      })

      await act(async () => {
        resolveSubmit!()
      })
    })

    it('should disable form fields during submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Test message')
      })

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeDisabled()
        expect(messageInput).toBeDisabled()
      })

      await act(async () => {
        resolveSubmit!()
      })
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal is closed', async () => {
      render(<ConversationLogModal {...defaultProps} />)

      const messageInput = screen.getByLabelText(/Message/i)
      await act(async () => {
        await userEvent.type(messageInput, 'Test message')
      })

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      
      await act(async () => {
        fireEvent.click(cancelButton)
      })

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should clear errors when modal is reopened', async () => {
      const { rerender } = render(<ConversationLogModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })
      
      await act(async () => {
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Message text is required')).toBeInTheDocument()
      })

      // Close and reopen modal
      await act(async () => {
        rerender(<ConversationLogModal {...defaultProps} open={false} />)
      })
      
      await act(async () => {
        rerender(<ConversationLogModal {...defaultProps} open={true} />)
      })

      expect(screen.queryByText('Message text is required')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Optimization', () => {
    it('should have large touch targets for buttons', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      const submitButton = screen.getByRole('button', { name: /Add Conversation/i })

      expect(cancelButton).toHaveClass('h-12')
      expect(submitButton).toHaveClass('h-12')
    })

    it('should have large select field', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const channelSelect = screen.getByRole('combobox')
      expect(channelSelect).toHaveClass('h-12')
    })
  })

  describe('Cancel Button', () => {
    it('should call onOpenChange when cancel is clicked', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      
      act(() => {
        fireEvent.click(cancelButton)
      })

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should not call onSubmit when cancel is clicked', () => {
      render(<ConversationLogModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      
      act(() => {
        fireEvent.click(cancelButton)
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })
})
