import apiClient, { getErrorMessage, isApiError, getToken, setToken, clearToken, isAuthenticated } from '../api-client'
import { ApiError } from '@/types'

describe('API Client Error Handling', () => {
  describe('isApiError', () => {
    it('should return true for valid API error', () => {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
      }

      expect(isApiError(apiError)).toBe(true)
    })

    it('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isApiError(error)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isApiError('error string')).toBe(false)
    })

    it('should return false for object without error property', () => {
      expect(isApiError({ message: 'error' })).toBe(false)
    })

    it('should return false for object with invalid error structure', () => {
      expect(isApiError({ error: 'string' })).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from API error', () => {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
        },
      }

      expect(getErrorMessage(apiError)).toBe('Invalid email format')
    })

    it('should extract message from regular Error', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should return default message for unknown error type', () => {
      expect(getErrorMessage('string error')).toBe('An unexpected error occurred')
      expect(getErrorMessage(null)).toBe('An unexpected error occurred')
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
      expect(getErrorMessage(123)).toBe('An unexpected error occurred')
    })

    it('should handle API error with details', () => {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            field: 'email',
            reason: 'Email already exists',
          },
        },
      }

      expect(getErrorMessage(apiError)).toBe('Validation failed')
    })
  })
})

describe('Token Management', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('setToken should save token to localStorage', () => {
    setToken('test-token')
    expect(localStorage.getItem('collab_khata_token')).toBe('test-token')
  })

  it('getToken should retrieve token from localStorage', () => {
    localStorage.setItem('collab_khata_token', 'test-token-2')
    expect(getToken()).toBe('test-token-2')
  })

  it('getToken should return null if not set', () => {
    expect(getToken()).toBeNull()
  })

  it('clearToken should remove token from localStorage', () => {
    localStorage.setItem('collab_khata_token', 'test-token-3')
    clearToken()
    expect(localStorage.getItem('collab_khata_token')).toBeNull()
  })

  it('isAuthenticated should return true if token exists', () => {
    localStorage.setItem('collab_khata_token', 'test-token-4')
    expect(isAuthenticated()).toBe(true)
  })

  it('isAuthenticated should return false if token does not exist', () => {
    expect(isAuthenticated()).toBe(false)
  })
})

describe('API Client Interceptors', () => {
  let requestInterceptorFulfilled: Function
  let requestInterceptorRejected: Function
  let responseInterceptorFulfilled: Function
  let responseInterceptorRejected: Function

  beforeEach(() => {
    localStorage.clear()

    const reqHandlers = (apiClient.interceptors.request as any).handlers
    const resHandlers = (apiClient.interceptors.response as any).handlers
    
    requestInterceptorFulfilled = reqHandlers[0].fulfilled
    requestInterceptorRejected = reqHandlers[0].rejected
    responseInterceptorFulfilled = resHandlers[0].fulfilled
    responseInterceptorRejected = resHandlers[0].rejected
  })

  it('request interceptor adds Authorization header if token exists', () => {
    setToken('intercept-token')
    const config = { headers: {} }
    const result = requestInterceptorFulfilled(config)
    expect(result.headers.Authorization).toBe('Bearer intercept-token')
  })

  it('request interceptor does not add Authorization header if token does not exist', () => {
    const config = { headers: {} }
    const result = requestInterceptorFulfilled(config)
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('request interceptor does not add Authorization header if config.headers is undefined', () => {
    setToken('intercept-token')
    const config = {}
    const result = requestInterceptorFulfilled(config)
    expect(result.headers).toBeUndefined()
  })

  it('request interceptor handles errors', async () => {
    const error = new Error('Request error')
    await expect(requestInterceptorRejected(error)).rejects.toBe(error)
  })

  it('response interceptor simply returns response', () => {
    const response = { data: 'test' }
    expect(responseInterceptorFulfilled(response)).toBe(response)
  })

  it('response interceptor redirects to login and clears token on 401 response', async () => {
    setToken('expired-token')
    const error = {
      response: {
        status: 401,
        data: { error: { code: 'UNAUTHORIZED', message: 'Token expired' } }
      }
    }

    try {
      await responseInterceptorRejected(error)
      fail('Should have rejected or thrown navigation error')
    } catch (e: any) {
      if (e.message && e.message.includes('navigation')) {
        // JSDOM throws this when window.location.href is assigned
      } else {
        expect(e).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } })
      }
    }

    expect(getToken()).toBeNull()
  })
  
  it('response interceptor redirects to login and clears token on 401 response (window undefined)', async () => {
    const originalWin = global.window
    // @ts-ignore
    delete (global as any).window
    
    const error = {
      response: {
        status: 401,
        data: { error: { code: 'UNAUTHORIZED', message: 'Token expired' } }
      }
    }

    try {
      await responseInterceptorRejected(error)
      fail('Should have rejected')
    } catch (e) {
      expect(e).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } })
    }
    
    global.window = originalWin
  })

  it('response interceptor formats general API error response correctly', async () => {
    const apiError = { error: { code: 'BAD_REQUEST', message: 'Invalid data' } }
    const error = {
      response: {
        status: 400,
        data: apiError
      }
    }

    try {
      await responseInterceptorRejected(error)
      fail('Should have rejected')
    } catch (e) {
      expect(e).toEqual(apiError)
    }
  })

  it('response interceptor provides default error response when response data is empty', async () => {
    const error = {
      response: {
        status: 500,
        data: null
      }
    }

    try {
      await responseInterceptorRejected(error)
      fail('Should have rejected')
    } catch (e) {
      expect(e).toEqual({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        }
      })
    }
  })

  it('response interceptor formats network error response correctly', async () => {
    const error = {} // No response object

    try {
      await responseInterceptorRejected(error)
      fail('Should have rejected')
    } catch (e) {
      expect(e).toEqual({
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to the server. Please check your internet connection.',
        },
      })
    }
  })
})
