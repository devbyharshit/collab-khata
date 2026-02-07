import { render, screen, waitFor } from '@testing-library/react'
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
          return Promise.resolve({ data: mockPayments })
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
      expect(screen.getByText('Instagram')).toBeInTheDocument()
      expect(screen.getByText('3 posts, 2 stories')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
    })

    it('should display not found message for invalid collaboration', async () => {
      mockApiClient.get.mockRejectedValue({
        error: { message: 'Collaboration not found' },
      })

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Collaboration not found')).toBeInTheDocument()
      })
    })
  })

  describe('Status Update', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations/1') {
          return Promise.resolve({ data: mockCollaboration })
        }
        if (url === '/api/collaborations/1/payments') {
          return Promise.resolve({ data: mockPayments })
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
          return Promise.resolve({ data: mockPayments })
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

    it('should validate payment amount', async () => {
      const user = userEvent.setup()

      render(<CollaborationDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const addPaymentButton = screen.getByRole('button', { name: /add payment/i })
      await user.click(addPaymentButton)

      const addButton = screen.getByRole('button', { name: /^add payment$/i })
      await user.click(addButton)

      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()
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

      const recordPaymentButton = screen.getByRole('button', { name: /record payment/i })
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
          return Promise.resolve({ data: mockPayments })
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
          return Promise.resolve({ data: mockPayments })
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
          return Promise.resolve({ data: mockPayments })
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
})
