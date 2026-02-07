import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from '../page'
import { useAuth } from '@/contexts/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock AuthGuard to simplify testing
jest.mock('@/components/auth-guard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('RegisterPage', () => {
  const mockPush = jest.fn()
  const mockRegister = jest.fn()
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any)
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      register: jest.fn(),
      registerUser: mockRegister,
      logout: jest.fn(),
    })
  })

  it('should render registration form with all fields', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Remove HTML5 validation to test react-hook-form validation
    emailInput.type = 'text'

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '12345')
    await user.type(confirmPasswordInput, '12345')
    await user.click(submitButton)

    await waitFor(() => {
      const messages = screen.getAllByText(/password must be at least 6 characters/i)
      expect(messages.length).toBeGreaterThan(0)
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password456')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue(undefined)

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('should display error message on registration failure', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already exists'
    mockRegister.mockRejectedValue({
      error: {
        code: 'DUPLICATE_EMAIL',
        message: errorMessage,
      },
    })

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should disable form during submission', async () => {
    const user = userEvent.setup()
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/^email$/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('should have link to login page', () => {
    render(<RegisterPage />)

    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toHaveAttribute('href', '/auth/login')
  })
})
