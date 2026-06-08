import { render, screen } from '@testing-library/react'
import Home from '../page'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('Home Page', () => {
  const mockPush = jest.fn()
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush } as any)
  })

  it('renders loading state when auth is checking', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      registerUser: jest.fn(),
      logout: jest.fn(),
    })

    render(<Home />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByText('Collab Khata')).toBeInTheDocument()
  })

  it('redirects to dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: 1, email: 'test@example.com', created_at: '2024-01-01' },
      login: jest.fn(),
      register: jest.fn(),
      registerUser: jest.fn(),
      logout: jest.fn(),
    })

    const { container } = render(<Home />)
    expect(container.firstChild).toBeNull() // Returns null when redirecting
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      registerUser: jest.fn(),
      logout: jest.fn(),
    })

    const { container } = render(<Home />)
    expect(container.firstChild).toBeNull() // Returns null when redirecting
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })
})
