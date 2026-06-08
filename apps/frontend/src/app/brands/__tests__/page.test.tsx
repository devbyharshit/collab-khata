import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import BrandsPage from '../page'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import { Brand } from '@/types'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/lib/api-client')

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('BrandsPage', () => {
  const mockPush = jest.fn()
  const mockBrands: Brand[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Nike',
      contact_name: 'John Doe',
      contact_email: 'john@nike.com',
      contact_channel: 'Instagram',
      notes: 'Sports brand',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      user_id: 1,
      name: 'Adidas',
      contact_name: 'Jane Smith',
      contact_email: 'jane@adidas.com',
      contact_channel: 'Email',
      notes: 'Athletic wear',
      created_at: '2024-01-02T00:00:00Z',
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

  describe('Brand Listing', () => {
    it('should display loading state while fetching brands', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}))

      render(<BrandsPage />)

      expect(screen.getByText('Brands')).toBeInTheDocument()
      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should display brands list after successful fetch', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
        expect(screen.getByText('Adidas')).toBeInTheDocument()
      })

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@adidas.com')).toBeInTheDocument()
    })

    it('should display empty state when no brands exist', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      expect(screen.getByText(/Get started by adding your first brand contact/i)).toBeInTheDocument()
    })

    it('should display error message on fetch failure', async () => {
      mockApiClient.get.mockRejectedValue({
        error: { message: 'Failed to load brands' },
      })

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load brands')).toBeInTheDocument()
      })
    })
  })

  describe('Brand Search', () => {
    it('should filter brands by name', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search brands/i)
      await user.type(searchInput, 'Nike')

      expect(screen.getByText('Nike')).toBeInTheDocument()
      expect(screen.queryByText('Adidas')).not.toBeInTheDocument()
    })

    it('should filter brands by contact name', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search brands/i)
      await user.type(searchInput, 'Jane')

      expect(screen.queryByText('Nike')).not.toBeInTheDocument()
      expect(screen.getByText('Adidas')).toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search brands/i)
      await user.type(searchInput, 'NonExistent')

      expect(screen.getByText('No brands found')).toBeInTheDocument()
      expect(screen.getByText(/Try adjusting your search query/i)).toBeInTheDocument()
    })
  })

  describe('Brand Creation', () => {
    it('should open create dialog when Add Brand button is clicked', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add New Brand')).toBeInTheDocument()
    })

    it('should validate required brand name field', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      const createButton = screen.getByRole('button', { name: /create brand/i })
      await user.click(createButton)

      expect(screen.getByText('Brand name is required')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      const nameInput = screen.getByLabelText(/brand name/i)
      const emailInput = screen.getByLabelText(/contact email/i)

      await user.type(nameInput, 'Test Brand')
      await user.type(emailInput, 'invalid-email')

      const createButton = screen.getByRole('button', { name: /create brand/i })
      await user.click(createButton)

      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })

    it('should create brand with valid data', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 3,
          user_id: 1,
          name: 'New Brand',
          contact_name: 'Test Contact',
          contact_email: 'test@brand.com',
          contact_channel: 'WhatsApp',
          notes: 'Test notes',
          created_at: '2024-01-03T00:00:00Z',
        },
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      await user.type(screen.getByLabelText(/brand name/i), 'New Brand')
      await user.type(screen.getByLabelText(/contact person name/i), 'Test Contact')
      await user.type(screen.getByLabelText(/contact email/i), 'test@brand.com')
      await user.type(screen.getByLabelText(/contact channel/i), 'WhatsApp')
      await user.type(screen.getByLabelText(/notes/i), 'Test notes')

      const createButton = screen.getByRole('button', { name: /create brand/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/brands', {
          name: 'New Brand',
          contact_name: 'Test Contact',
          contact_email: 'test@brand.com',
          contact_channel: 'WhatsApp',
          notes: 'Test notes',
        })
      })
    })
  })

  describe('Brand Editing', () => {
    it('should open edit dialog with pre-filled data', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      // Find the edit button by test id
      const editButton = screen.getByTestId('edit-brand-1')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Brand')).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('Nike')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('john@nike.com')).toBeInTheDocument()
    })

    it('should update brand with valid data', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      mockApiClient.put.mockResolvedValue({
        data: { ...mockBrands[0], name: 'Updated Nike' },
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      // Find the edit button by test id
      const editButton = screen.getByTestId('edit-brand-1')
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Brand')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('Nike')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Nike')

      const updateButton = screen.getByRole('button', { name: /update brand/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/api/brands/1', expect.objectContaining({
          name: 'Updated Nike',
        }))
      })
    })
  })

  describe('Brand Deletion', () => {
    it('should open delete confirmation dialog', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      // Find the delete button by test id
      const deleteButton = screen.getByTestId('delete-brand-1')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Delete Brand' })).toBeInTheDocument()
      })

      expect(screen.getByText(/are you sure you want to delete "nike"/i)).toBeInTheDocument()
    })

    it('should delete brand when confirmed', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: mockBrands 
      })
      mockApiClient.delete.mockResolvedValue({ data: null })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      // Find the delete button by test id
      const deleteButton = screen.getByTestId('delete-brand-1')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Delete Brand' })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete brand/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockApiClient.delete).toHaveBeenCalledWith('/api/brands/1')
      })
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should render mobile-optimized forms with large touch targets', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      // Check that regular inputs (not textarea) have adequate height for mobile (h-12 = 3rem = 48px)
      const nameInput = screen.getByLabelText(/brand name/i)
      expect(nameInput.className).toContain('h-12')
      
      const emailInput = screen.getByLabelText(/contact email/i)
      expect(emailInput.className).toContain('h-12')
    })

    it('should have full-width buttons on mobile', async () => {
      mockApiClient.get.mockResolvedValue({ 
        data: [] 
      })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      const createButton = screen.getByRole('button', { name: /create brand/i })
      expect(createButton.className).toContain('w-full')
    })
  })

  describe('Error Handling and UI edges', () => {
    it('should show error and clear on dismiss', async () => {
      mockApiClient.get.mockRejectedValue({ error: { message: 'Fetch error' } })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Fetch error')).toBeInTheDocument()
      })

      const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissBtn)

      expect(screen.queryByText('Fetch error')).not.toBeInTheDocument()
    })

    it('should clear field errors on input change', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)

      const createButton = screen.getByRole('button', { name: /create brand/i })
      await user.click(createButton)

      expect(screen.getByText('Brand name is required')).toBeInTheDocument()

      const nameInput = screen.getByLabelText(/brand name/i)
      await user.type(nameInput, 'S')

      expect(screen.queryByText('Brand name is required')).not.toBeInTheDocument()
    })

    it('should close dialogs on cancel', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBrands })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      // Create cancel
      const addButton = screen.getByRole('button', { name: /add brand/i })
      await user.click(addButton)
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByText('Add New Brand')).not.toBeInTheDocument()

      // Edit cancel
      await user.click(screen.getByTestId('edit-brand-1'))
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByText('Edit Brand')).not.toBeInTheDocument()

      // Delete cancel
      await user.click(screen.getByTestId('delete-brand-1'))
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByRole('heading', { name: 'Delete Brand' })).not.toBeInTheDocument()
    })

    it('should show error when create fails', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] })
      mockApiClient.post.mockRejectedValue({ error: { message: 'Create failed' } })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add brand/i }))
      await user.type(screen.getByLabelText(/brand name/i), 'New Brand')
      await user.click(screen.getByRole('button', { name: /create brand/i }))

      await waitFor(() => {
        expect(screen.getByText('Create failed')).toBeInTheDocument()
      })
    })

    it('should show error when update fails', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBrands })
      mockApiClient.put.mockRejectedValue({ error: { message: 'Update failed' } })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('edit-brand-1'))
      await user.click(screen.getByRole('button', { name: /update brand/i }))

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument()
      })
    })

    it('should show error when delete fails', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockBrands })
      mockApiClient.delete.mockRejectedValue({ error: { message: 'Delete failed' } })
      const user = userEvent.setup()

      render(<BrandsPage />)

      await waitFor(() => {
        expect(screen.getByText('Nike')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('delete-brand-1'))
      await user.click(screen.getByRole('button', { name: /delete brand/i }))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })
    
    it('should handle non-array brands gracefully', async () => {
      mockApiClient.get.mockResolvedValue({ data: { someObj: "not an array" } as any })
      render(<BrandsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No brands yet')).toBeInTheDocument()
      })
    })
  })
})