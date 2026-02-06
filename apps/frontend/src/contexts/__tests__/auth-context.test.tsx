import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import apiClient, { setToken, clearToken, getToken } from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  setToken: jest.fn(),
  clearToken: jest.fn(),
  getToken: jest.fn(),
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>
const mockSetToken = setToken as jest.MockedFunction<typeof setToken>
const mockClearToken = clearToken as jest.MockedFunction<typeof clearToken>
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockReturnValue(null)
  })

  it('should initialize with no user when no token exists', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should load user when valid token exists', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      created_at: '2024-01-01',
    }

    mockGetToken.mockReturnValue('valid-token')
    mockApiClient.get.mockResolvedValue({ data: mockUser })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should clear token when loading user fails', async () => {
    mockGetToken.mockReturnValue('invalid-token')
    mockApiClient.get.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockClearToken).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login successfully', async () => {
    const mockAuthResponse = {
      access_token: 'new-token',
      token_type: 'bearer',
    }
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      created_at: '2024-01-01',
    }

    mockApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse })
    mockApiClient.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })
    expect(mockSetToken).toHaveBeenCalledWith('new-token')
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should register successfully', async () => {
    const mockAuthResponse = {
      access_token: 'new-token',
      token_type: 'bearer',
    }
    const mockUser = {
      id: 1,
      email: 'newuser@example.com',
      created_at: '2024-01-01',
    }

    mockApiClient.post.mockResolvedValueOnce({ data: mockAuthResponse })
    mockApiClient.get.mockResolvedValueOnce({ data: mockUser })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
      })
    })

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/auth/register', {
      email: 'newuser@example.com',
      password: 'password123',
    })
    expect(mockSetToken).toHaveBeenCalledWith('new-token')
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should logout successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      created_at: '2024-01-01',
    }

    mockGetToken.mockReturnValue('valid-token')
    mockApiClient.get.mockResolvedValue({ data: mockUser })

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    act(() => {
      result.current.logout()
    })

    expect(mockClearToken).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
