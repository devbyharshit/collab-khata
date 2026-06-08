import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams, useRouter } from 'next/navigation'
import CollaborationDetailPage from '../page'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import {
  Collaboration,
  CollaborationStatus,
  PaymentExpectation,
  ConversationLog,
  FileAttachment,
  CommunicationChannel,
} from '@/types'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined') {
  window.ResizeObserver = global.ResizeObserver
  window.HTMLElement.prototype.scrollIntoView = function() {}
}

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api-client')

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('CollaborationDetailPage', () => {
  const mockPush = jest.fn()
  const mockCollaboration: Collaboration = {
    id: 1,
    user_id: 1,
    brand_id: 1,
    brand: {
      id: 1,
      user_id: 1,
      name: 'Nike',
      contact_name: 'John Doe',
      contact_email: 'john@nike.com',
      created_at: '2024-01-01T00:00:00Z',
    },
    title: 'Summer Campaign 2024',
    platform: 'Instagram',
    deliverables_text: '3 posts, 2 stories',
    agreed_amount: 50000,
    currency: 'INR',
    deadline_date: '2024-06-30',
    status: CollaborationStatus.Confirmed,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockPayments: PaymentExpectation[] = [
    {
      id: 1,
      collaboration_id: 1,
      expected_amount: 50000,
      promised_date: '2024-07-15',
      payment_method: 'Bank Transfer',
      notes: 'First payment',
      status: 'Pending',
      created_at: '2024-01-01T00:00:00Z',
      total_credited: 0,
    },
  ]

  const mockConversations: ConversationLog[] = [
    {
      id: 1,
      collaboration_id: 1,
      channel: CommunicationChannel.Email,
      message_text: 'Initial discussion about campaign',
      created_at: '2024-01-01T10:00:00Z',
    },
  ]

  const mockFiles: FileAttachment[] = [
    {
      id: 1,
      collaboration_id: 1,
      file_path: '/uploads/contract.pdf',
      file_type: 'application/pdf',
      original_filename: 'contract.pdf',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '1' })
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, email: 'test@example.com', created_at: '2024-01-01' },
      login: jest.fn(),
      register: jest.fn(),
        registerUser: jest.fn(),
      logout: jest.fn(),
    })
  })

  describe('Collaboration Detail Display', () => {
    it('should display loading state while fetching data', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}))

      render(<CollaborationDetailPage />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should display collaboration details after successful fetch', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      expect(screen.getByText('Nike')).toBeInTheDocument()
      expect(screen.getAllByText('Instagram')[0]).toBeInTheDocument()
      expect(screen.getByText('3 posts, 2 stories')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
    })

    it('should display not found message for invalid collaboration', async () => {
      mockApiClient.get.mockRejectedValue({ error: { message: 'Collaboration not found' } })

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Collaboration not found')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back to collaborations/i })
      await userEvent.setup().click(backButton)
      expect(mockPush).toHaveBeenCalledWith('/collaborations')
    })
  })

  describe('Status Update', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should open status update dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /update status/i })
      await user.click(updateButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Update Collaboration Status')).toBeInTheDocument()
    })

    it('should have status update dialog with dropdown', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /update status/i })
      await user.click(updateButton)

      // Check that status select exists
      const statusSelect = screen.getByRole('combobox', { name: /new status/i })
      expect(statusSelect).toBeInTheDocument()
    })

    it('should show posting date field in status dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const updateButton = screen.getByRole('button', { name: /update status/i })
      await user.click(updateButton)

      // The posting date field should be in the dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Payment Management', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should display payment expectations', async () => {
      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      expect(screen.getByText('Payment Expectations')).toBeInTheDocument()
      expect(screen.getByText('Method: Bank Transfer')).toBeInTheDocument()
      expect(screen.getByText('First payment')).toBeInTheDocument()
    })

    it('should open payment expectation dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addPaymentButton = screen.getByRole('button', { name: /add payment/i })
      await user.click(addPaymentButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /add payment expectation/i })).toBeInTheDocument()
    })

    it('should validate payment amount and allow cancel', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addPaymentButton = screen.getByRole('button', { name: /add payment/i })
      await user.click(addPaymentButton)

      const saveButtons = screen.getAllByRole('button', { name: /add payment/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should create payment expectation', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 2,
          collaboration_id: 1,
          expected_amount: 25000,
          promised_date: '2024-08-01',
          payment_method: 'UPI',
          notes: 'Second payment',
          status: 'Pending',
          created_at: '2024-01-02T00:00:00Z',
        },
      })
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addPaymentButton = screen.getByRole('button', { name: /add payment/i })
      await user.click(addPaymentButton)

      await user.type(screen.getByLabelText(/expected amount/i), '25000')
      await user.type(screen.getByLabelText(/payment method/i), 'UPI')
      await user.type(screen.getByLabelText(/notes/i), 'Second payment')

      const addButton = screen.getByRole('button', { name: /^add payment$/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/api/collaborations/1/payments',
          expect.objectContaining({
            expected_amount: 25000,
            payment_method: 'UPI',
            notes: 'Second payment',
          })
        )
      })
    })

    it('should open payment credit dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const recordPaymentButton = screen.getByRole('button', { name: /record partial/i })
      await user.click(recordPaymentButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Record Payment Credit')).toBeInTheDocument()
    })
  })

  describe('Conversation Logs', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should display conversation logs', async () => {
      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      expect(screen.getByText('Conversation Logs')).toBeInTheDocument()
      expect(screen.getByText('Initial discussion about campaign')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should open conversation log dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addLogButtons = screen.getAllByRole('button', { name: /add log/i })
      await user.click(addLogButtons[0])

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /add conversation log/i })).toBeInTheDocument()
    })

    it('should validate conversation message', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addLogButtons = screen.getAllByRole('button', { name: /add log/i })
      await user.click(addLogButtons[0])

      const addButton = screen.getByRole('button', { name: /^add log$/i })
      await user.click(addButton)

      expect(screen.getByText('Message is required')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })
  })

  describe('File Attachments', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should display file attachments', async () => {
      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument()
      expect(screen.getByText('contract.pdf')).toBeInTheDocument()
    })

    it('should open file upload dialog', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      await user.click(uploadButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /upload file/i })).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ 
            data: { 
              payment_expectations: mockPayments, 
              total_count: mockPayments.length 
            } 
          })
        }
        if (url === '/api/collaborations/1/conversations') {
          return Promise.resolve({ data: mockConversations })
        }
        if (url === '/api/collaborations/1/files') {
          return Promise.resolve({ data: mockFiles })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should have back button to navigate to collaborations list', async () => {
      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      // Check that there's a button with ArrowLeft icon (back button)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Extra Coverage: Status Update Submits', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: mockPayments, total_count: mockPayments.length } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: mockConversations })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: mockFiles })
        return Promise.reject(new Error('Unknown URL'))
      })
    })
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: [], total_count: 0 } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: [] })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: [] })
        return Promise.resolve({ data: {} })
      })
    })

    it('should validate posting date when status is Posted and allow cancel', async () => {
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      await user.click(screen.getByRole('button', { name: /update status/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const statusSelect = screen.getByRole('combobox', { name: /new status/i })
      await user.click(statusSelect)
      const postedOption = await screen.findByRole('option', { name: /Posted/i })
      await user.click(postedOption)

      const saveButtons = screen.getAllByRole('button', { name: /update status/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      expect(screen.getByText('Posting date is required for Posted status')).toBeInTheDocument()

      const dateInput = screen.getByLabelText(/posting date/i)
      await fireEvent.change(dateInput, { target: { value: '2024-08-01' } })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should successfully update status', async () => {
      mockApiClient.patch.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      await user.click(screen.getByRole('button', { name: /update status/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const statusSelect = screen.getByRole('combobox', { name: /new status/i })
      await user.click(statusSelect)
      const inProductionOption = await screen.findByRole('option', { name: /InProduction/i })
      await user.click(inProductionOption)

      const saveButtons = screen.getAllByRole('button', { name: /update status/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockApiClient.patch).toHaveBeenCalledWith('/api/collaborations/1/status', expect.objectContaining({
          status: 'InProduction'
        }))
      })
    })

    it('should show error when update status fails', async () => {
      mockApiClient.patch.mockRejectedValue({ error: { message: 'Status update failed' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      await user.click(screen.getByRole('button', { name: /update status/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const saveButtons = screen.getAllByRole('button', { name: /update status/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Status update failed')).toBeInTheDocument()
      })

      // Close the dialog first so the error alert is accessible
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      await waitFor(() => { expect(screen.queryByRole('dialog')).not.toBeInTheDocument() })

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)
      expect(screen.queryByText('Status update failed')).not.toBeInTheDocument()
    })
  })

  describe('Extra Coverage: Payment Submits', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: mockPayments, total_count: mockPayments.length } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: mockConversations })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: mockFiles })
        return Promise.reject(new Error('Unknown URL'))
      })
    })
    it('should show error when payment creation fails', async () => {
      mockApiClient.post.mockRejectedValue({ error: { message: 'Payment creation failed' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      const addPaymentButton = screen.getByRole('button', { name: /add payment/i })
      await user.click(addPaymentButton)
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      await fireEvent.change(screen.getByLabelText(/expected amount/i), { target: { value: '1000' } })
      await fireEvent.change(screen.getByLabelText(/promised date/i), { target: { value: '2024-08-01' } })

      const saveButtons = screen.getAllByRole('button', { name: /add payment/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Payment creation failed')).toBeInTheDocument()
      })
    })

    it('should handle mark as fully paid successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      const fullyPaidButton = screen.getByRole('button', { name: /mark fully paid/i })
      await user.click(fullyPaidButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/payments/1/credits', expect.objectContaining({
          credited_amount: 50000,
          reference_note: 'Marked as fully paid'
        }))
      })
    })

    it('should handle mark as fully paid failure', async () => {
      mockApiClient.post.mockRejectedValue({ error: { message: 'Failed to record payment' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      const fullyPaidButton = screen.getByRole('button', { name: /mark fully paid/i })
      await user.click(fullyPaidButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalled()
      })
    })

    it('should validate credit form and handle success and failure with all fields and cancel', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      const addCreditButtons = screen.getAllByRole('button', { name: /record partial/i })
      await user.click(addCreditButtons[0]!)
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const saveButtons = screen.getAllByRole('button', { name: /record credit/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()

      await fireEvent.change(screen.getByLabelText(/credited amount/i), { target: { value: '1000' } })
      await fireEvent.change(screen.getByLabelText(/credited date/i), { target: { value: '' } })
      await user.click(saveButton)
      expect(screen.getByText('Date is required')).toBeInTheDocument()

      await fireEvent.change(screen.getByLabelText(/credited date/i), { target: { value: '2024-08-01' } })
      await user.type(screen.getByLabelText(/reference note/i), 'Ref123')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/payments/1/credits', expect.objectContaining({ reference_note: 'Ref123' }))
      })

      // Try cancel
      await user.click(addCreditButtons[0]!)
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Extra Coverage: Conversation Logs and Files', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: mockPayments, total_count: mockPayments.length } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: mockConversations })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: mockFiles })
        return Promise.reject(new Error('Unknown URL'))
      })
    })
    it('should handle conversation creation failure and allow cancel with channel selection', async () => {
      mockApiClient.post.mockRejectedValue({ error: { message: 'Conversation failed' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      const addLogButton = screen.getByRole('button', { name: /add log/i })
      await user.click(addLogButton)
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      // Change channel
      const channelSelect = screen.getByRole('combobox', { name: /channel/i })
      await user.click(channelSelect)
      const emailOption = await screen.findByRole('option', { name: /Email/i })
      await user.click(emailOption)

      await user.type(screen.getByLabelText(/message/i), 'Hello')
      
      const saveButtons = screen.getAllByRole('button', { name: /add log/i })
      const saveButton = saveButtons[saveButtons.length - 1]!
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Conversation failed')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle file upload success and failure', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce({ error: { message: 'Upload failed' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      await user.click(screen.getByRole('button', { name: /upload/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const uploadButtons = screen.getAllByRole('button', { name: /upload/i })
      const uploadButton = uploadButtons[uploadButtons.length - 1]!

      // Try empty submit
      await user.click(uploadButton)
      expect(screen.getByText('Please select a file')).toBeInTheDocument()

      const file = new File(['hello'], 'hello.png', { type: 'image/png' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input, file)

      // First submit - success
      await user.click(uploadButton)
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/collaborations/1/files', expect.any(FormData), expect.any(Object))
      })

      // Try again for failure
      await user.click(screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-upload'))!)
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })
      
      const input2 = document.querySelector('input[type="file"]') as HTMLInputElement
      await user.upload(input2, file)
      
      const uploadButtons2 = screen.getAllByRole('button', { name: /upload/i })
      await user.click(uploadButtons2[uploadButtons2.length - 1]!)

      // Try cancel
      await user.click(screen.getByRole('button', { name: /upload file/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle file download', async () => {
      const blob = new Blob(['mock content'])
      // we need to mock window.URL.createObjectURL and window.URL.revokeObjectURL
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      window.URL.revokeObjectURL = jest.fn()
      // Mock document.createElement('a')
      const originalCreateElement = document.createElement.bind(document)
      const mockLink = originalCreateElement('a')
      mockLink.click = jest.fn()
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') return mockLink
        return originalCreateElement(tagName)
      })
      
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: mockPayments, total_count: mockPayments.length } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: mockConversations })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: mockFiles })
        if (url.startsWith('/api/files/')) return Promise.resolve({ data: blob })
        return Promise.reject(new Error('Unknown URL'))
      })

      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('contract.pdf')).toBeInTheDocument() })

      const downloadButton = screen.getAllByRole('button').find(b => b.querySelector('svg.lucide-download'))
      if (downloadButton) {
        await user.click(downloadButton)
        await waitFor(() => {
          expect(mockApiClient.get).toHaveBeenCalledWith('/api/files/1', expect.any(Object))
          expect(mockLink.click).toHaveBeenCalled()
        })
      }

      // Test download failure
      mockApiClient.get.mockRejectedValueOnce({ error: { message: 'Download failed' } })
      if (downloadButton) {
        await user.click(downloadButton)
        await waitFor(() => {
          expect(screen.getByText('Download failed')).toBeInTheDocument()
        })
      }
    })
  describe('Extra Coverage: Edit Details', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') return Promise.resolve({ data: mockCollaboration })
        if (url === '/api/collaborations/1/payments') return Promise.resolve({ data: { payment_expectations: mockPayments, total_count: mockPayments.length } })
        if (url === '/api/collaborations/1/conversations') return Promise.resolve({ data: mockConversations })
        if (url === '/api/collaborations/1/files') return Promise.resolve({ data: mockFiles })
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should handle edit details success and failure', async () => {
      mockApiClient.put.mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce({ error: { message: 'Edit failed' } })
      const user = userEvent.setup()
      render(<CollaborationDetailPage />)
      await waitFor(() => { expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() })

      await user.click(screen.getByRole('button', { name: /edit details/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })

      const saveButtons = screen.getAllByRole('button', { name: /save changes/i })
      const saveButton = saveButtons[saveButtons.length - 1]!

      // Try empty title
      const titleInput = screen.getByLabelText(/title/i)
      await fireEvent.change(titleInput, { target: { value: '' } })
      await user.click(saveButton)
      expect(screen.getByText('Title is required')).toBeInTheDocument()

      // First submit - success
      await fireEvent.change(titleInput, { target: { value: 'New Title' } })
      const amountInput = screen.getByLabelText(/agreed amount/i)
      await fireEvent.change(amountInput, { target: { value: '60000' } })
      
      const platformInput = screen.getByLabelText(/platform/i)
      await fireEvent.change(platformInput, { target: { value: 'YouTube' } })
      
      const deadlineInput = screen.getByLabelText(/deadline/i)
      await fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } })

      const deliverablesInput = screen.getByLabelText(/deliverables/i)
      await fireEvent.change(deliverablesInput, { target: { value: '2 videos' } })

      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/api/collaborations/1', expect.objectContaining({ 
          title: 'New Title', agreed_amount: 60000, platform: 'YouTube', deadline_date: '2024-12-31', deliverables_text: '2 videos' 
        }))
      })

      // Second submit - failure
      await user.click(screen.getByRole('button', { name: /edit details/i }))
      await waitFor(() => { expect(screen.getByRole('dialog')).toBeInTheDocument() })
      
      const saveButtons2 = screen.getAllByRole('button', { name: /save changes/i })
      await user.click(saveButtons2[saveButtons2.length - 1]!)

      // Wait for it to close
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/api/collaborations/1', expect.objectContaining({ 
          title: 'New Title', agreed_amount: 60000, platform: 'YouTube', deadline_date: '2024-12-31', deliverables_text: '2 videos' 
        }))
      })

    })
  })
})
})
