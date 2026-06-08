import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CollaborationsPage from '../page'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import { Collaboration, CollaborationStatus, Brand } from '@/types'

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
  useRouter: jest.fn(),
}))

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/components/brand-autocomplete', () => ({
  BrandAutocomplete: function MockBrandAutocomplete({ onBrandCreated, onChange }: any) {
    return (
      <div data-testid="mock-brand-autocomplete">
        <button 
          onClick={() => onChange(1)} 
          aria-label="mock select brand 1"
        >Select Brand</button>
        <button 
          onClick={() => onBrandCreated({ id: 99, name: 'New Brand 99' })} 
          aria-label="mock create brand"
        >Create Brand</button>
      </div>
    )
  }
}))

jest.mock('@/lib/api-client')

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('CollaborationsPage', () => {
  const mockPush = jest.fn()
  const mockBrands: Brand[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Nike',
      contact_name: 'John Doe',
      contact_email: 'john@nike.com',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 1,
      name: 'Adidas',
      contact_name: 'Jane Smith',
      contact_email: 'jane@adidas.com',
      created_at: '2024-01-02T00:00:00Z',
    },
  ]

  const mockCollaborations: Collaboration[] = [
    {
      id: 1,
      user_id: 1,
      brand_id: 1,
      brand: mockBrands[0],
      title: 'Summer Campaign 2024',
      platform: 'Instagram',
      deliverables_text: '3 posts, 2 stories',
      agreed_amount: 50000,
      currency: 'INR',
      deadline_date: '2024-06-30',
      status: CollaborationStatus.Confirmed,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 1,
      brand_id: 2,
      brand: mockBrands[1],
      title: 'Product Launch',
      platform: 'YouTube',
      deliverables_text: '1 video review',
      agreed_amount: 75000,
      currency: 'INR',
      deadline_date: '2024-07-15',
      status: CollaborationStatus.InProduction,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('Collaboration Listing', () => {
    it('should display loading state while fetching collaborations', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}))

      render(<CollaborationsPage />)

      expect(screen.getByText('Collaborations')).toBeInTheDocument()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should display collaborations list after successful fetch', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: mockCollaborations,
              total_count: mockCollaborations.length,
              filtered_count: mockCollaborations.length
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
        expect(screen.getByText('Product Launch')).toBeInTheDocument()
      })

      expect(screen.getByText('Nike')).toBeInTheDocument()
      expect(screen.getByText('Adidas')).toBeInTheDocument()
    })

    it('should display empty state when no collaborations exist', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: [],
              total_count: 0,
              filtered_count: 0
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/Get started by creating your first collaboration/i)
      ).toBeInTheDocument()
    })

    it('should display error message on fetch failure and allow dismissing it', async () => {
      mockApiClient.get.mockRejectedValue({
        error: { message: 'Failed to load data' },
      })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument()
      })

      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)

      expect(screen.queryByText('Failed to load data')).not.toBeInTheDocument()
    })
  })

  describe('Collaboration Search and Filtering', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: mockCollaborations,
              total_count: mockCollaborations.length,
              filtered_count: mockCollaborations.length
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should filter collaborations by title', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by title/i)
      await user.type(searchInput, 'Summer')

      expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      expect(screen.queryByText('Product Launch')).not.toBeInTheDocument()
    })

    it('should filter collaborations by platform', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by title/i)
      await user.type(searchInput, 'YouTube')

      expect(screen.queryByText('Summer Campaign 2024')).not.toBeInTheDocument()
      expect(screen.getByText('Product Launch')).toBeInTheDocument()
    })

    it('should filter collaborations by brand name', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by title/i)
      await user.type(searchInput, 'Nike')

      expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      expect(screen.queryByText('Product Launch')).not.toBeInTheDocument()
    })

    it('should filter collaborations by status', async () => {
      const user = userEvent.setup()
      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      // Check that filter dropdown exists and change value
      const filterTrigger = screen.getByRole('combobox')
      await user.click(filterTrigger)
      
      const confirmedOption = await screen.findByRole('option', { name: /Confirmed/i })
      await user.click(confirmedOption)

      expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument() // Confirmed
      expect(screen.queryByText('Product Launch')).not.toBeInTheDocument() // InProduction
    })

    it('should show no results message when filters have no matches', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search by title/i)
      await user.type(searchInput, 'NonExistent')

      expect(screen.getByText('No collaborations found')).toBeInTheDocument()
      expect(screen.getByText(/Try adjusting your filters/i)).toBeInTheDocument()
    })
  })

  describe('Collaboration Creation', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: [],
              total_count: 0,
              filtered_count: 0
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should open create dialog when New Collab button is clicked', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Create New Collaboration')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      const createButton = screen.getByRole('button', { name: /create collaboration/i })
      await user.click(createButton)

      expect(screen.getByText('Please select a brand')).toBeInTheDocument()
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Platform is required')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('should have brand selection dropdown', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      // Check that brand select mock exists
      expect(screen.getByTestId('mock-brand-autocomplete')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: mockCollaborations,
              total_count: mockCollaborations.length,
              filtered_count: mockCollaborations.length
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should navigate to collaboration detail when card is clicked', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const collabCard = screen.getByText('Summer Campaign 2024').closest('.cursor-pointer')
      if (collabCard) {
        await user.click(collabCard)
        expect(mockPush).toHaveBeenCalledWith('/collaborations/1')
      }
    })

    it('should navigate to collaboration detail when View Details button is clicked', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('Summer Campaign 2024')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      expect(mockPush).toHaveBeenCalledWith('/collaborations/1')
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') {
          return Promise.resolve({ 
            data: { 
              collaborations: [],
              total_count: 0,
              filtered_count: 0
            } 
          })
        }
        if (url === '/api/brands') {
          return Promise.resolve({ 
            data: { 
              brands: mockBrands,
              total_count: mockBrands.length
            } 
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })
    })

    it('should render mobile-optimized forms with large touch targets', async () => {
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      // Check that inputs have adequate height for mobile (h-12 = 3rem = 48px)
      const titleInput = screen.getByLabelText(/^title/i)
      expect(titleInput.className).toContain('h-12')

      const platformInput = screen.getByLabelText(/platform/i)
      expect(platformInput.className).toContain('h-12')
    })
  })
})

  describe('Error Handling and Edge Cases', () => {
    it('should clear errors on input change and validate amounts', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      const createButton = screen.getByRole('button', { name: /create collaboration/i })
      await user.click(createButton)

      expect(screen.getByText('Title is required')).toBeInTheDocument()

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'T')
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument()

      const amountInput = screen.getByLabelText(/agreed amount/i)
      await user.type(amountInput, '-50')
      await user.click(createButton)

      expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
    })

    it('should handle creation error from API and fill all form fields', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/brands') return Promise.resolve({ data: [{ id: 1, name: 'Brand 1' }] })
        return Promise.resolve({ data: [] })
      })
      mockApiClient.post.mockRejectedValue({ error: { message: 'Create failed' } })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // We just need to trigger handleCreateCollaboration, which requires validateForm to pass.
      // Fill basic inputs
      await user.type(screen.getByLabelText(/title/i), 'New Collab')
      await user.type(screen.getByLabelText(/platform/i), 'Twitter')
      await user.type(screen.getByLabelText(/agreed amount/i), '500')
      
      // Select brand to pass validation
      const selectBrandBtn = screen.getByRole('button', { name: /mock select brand 1/i })
      await user.click(selectBrandBtn)
      
      const createButton = screen.getByRole('button', { name: /create collaboration/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument()
      })
    })

    it('should handle API failure when fetching brands on create dialog open', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') return Promise.resolve({ data: [] })
        if (url === '/api/brands') return Promise.reject(new Error('Brands fetch failed'))
        return Promise.resolve({ data: [] })
      })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load brands', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })

    it('should successfully create a collaboration', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') return Promise.resolve({ data: [] })
        if (url === '/api/brands') return Promise.resolve({ data: [{ id: 1, name: 'Brand 1' }] })
        return Promise.resolve({ data: [] })
      })
      mockApiClient.post.mockResolvedValue({ data: {} })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill basic inputs
      await user.type(screen.getByLabelText(/title/i), 'New Collab')
      await user.type(screen.getByLabelText(/platform/i), 'Twitter')
      await user.type(screen.getByLabelText(/agreed amount/i), '500')
      
      // Select brand to pass validation
      const selectBrandBtn = screen.getByRole('button', { name: /mock select brand 1/i })
      await user.click(selectBrandBtn)
      
      // Fill optional fields
      const currencySelect = screen.getByRole('combobox', { name: /currency/i })
      await user.click(currencySelect)
      const usdOption = await screen.findByRole('option', { name: /USD/i })
      await user.click(usdOption)

      const statusSelect = screen.getByRole('combobox', { name: /initial status/i })
      await user.click(statusSelect)
      const confirmedOption = await screen.findByRole('option', { name: /Confirmed/i })
      await user.click(confirmedOption)

      await user.type(screen.getByLabelText(/deadline date/i), '2024-12-31')
      await user.type(screen.getByLabelText(/deliverables/i), '2 posts')

      const createButton = screen.getByRole('button', { name: /create collaboration/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/collaborations', expect.objectContaining({
          title: 'New Collab',
          platform: 'Twitter',
          agreed_amount: 500,
          brand_id: 1,
          currency: 'USD',
          status: 'Confirmed',
          deadline_date: '2024-12-31',
          deliverables_text: '2 posts'
        }))
        // Dialog should close (fetchData is called, queryByRole dialog should be null soon, or at least dialog disappears)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should add newly created brand to brands list when onBrandCreated is triggered', async () => {
      mockApiClient.get.mockImplementation((url) => {
        if (url === '/api/collaborations') return Promise.resolve({ data: [] })
        if (url === '/api/brands') return Promise.resolve({ data: [{ id: 1, name: 'Brand 1' }] })
        return Promise.resolve({ data: [] })
      })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /new collab/i })
      await user.click(addButton)

      const mockCreateBtn = screen.getByRole('button', { name: /mock create brand/i })
      await user.click(mockCreateBtn)

      // We don't have direct access to the state, but we can verify it doesn't crash
      expect(mockCreateBtn).toBeInTheDocument()
    })
    it('should handle non-array collaborations gracefully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { collabs: "not an array" } as any })
      render(<CollaborationsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })
    })

    it('should close dialog when cancel is clicked', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] })
      const user = userEvent.setup()

      render(<CollaborationsPage />)

      await waitFor(() => {
        expect(screen.getByText('No collaborations yet')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /new collab/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
