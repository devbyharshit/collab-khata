import { renderHook, act } from '@testing-library/react'
import { useApiError } from '../use-api-error'
import { getErrorMessage } from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  getErrorMessage: jest.fn()
}))

describe('useApiError', () => {
  const mockGetErrorMessage = getErrorMessage as jest.MockedFunction<typeof getErrorMessage>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with null error', () => {
    const { result } = renderHook(() => useApiError())
    expect(result.current.error).toBeNull()
  })

  it('should set error using handleError', () => {
    const expectedErrorMsg = 'Test error message'
    mockGetErrorMessage.mockReturnValue(expectedErrorMsg)

    const { result } = renderHook(() => useApiError())

    act(() => {
      result.current.handleError(new Error('Some error'))
    })

    expect(result.current.error).toBe(expectedErrorMsg)
    expect(mockGetErrorMessage).toHaveBeenCalledWith(new Error('Some error'))
  })

  it('should clear error using clearError', () => {
    mockGetErrorMessage.mockReturnValue('Test error message')

    const { result } = renderHook(() => useApiError())

    act(() => {
      result.current.handleError(new Error('Some error'))
    })

    expect(result.current.error).toBe('Test error message')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
