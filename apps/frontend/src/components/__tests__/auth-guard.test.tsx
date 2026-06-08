import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '../auth-guard'
import { useAuth } from '@/contexts/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

describe('AuthGuard', () => {
  const mockPush = jest.fn()
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
  })

  describe('requireAuth=true (protected routes)', () => {
    it('should show loading state while checking authentication', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should redirect to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should redirect to custom path when specified', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={true} redirectTo="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-login')
      })
    })

    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { id: 1, email: 'test@example.com', created_at: '2024-01-01' },
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={true}>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('requireAuth=false (public routes)', () => {
    it('should redirect to dashboard when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { id: 1, email: 'test@example.com', created_at: '2024-01-01' },
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument()
    })

    it('should render children when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
        login: jest.fn(),
        register: jest.fn(),
        registerUser: jest.fn(),
        logout: jest.fn(),
      })

      render(
        <AuthGuard requireAuth={false}>
          <div>Public Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Public Content')).toBeInTheDocument()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
