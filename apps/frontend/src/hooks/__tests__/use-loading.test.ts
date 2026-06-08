import { renderHook, act } from '@testing-library/react'
import { useLoading } from '../use-loading'
import { toast } from '@/lib/toast'

// Mock the toast library
jest.mock('@/lib/toast', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }
}))

describe('useLoading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with isLoading false', () => {
    const { result } = renderHook(() => useLoading())
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle successful async function without toasts', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockAsyncFn = jest.fn().mockResolvedValue('success data')

    let returnVal
    await act(async () => {
      returnVal = await result.current.withLoading(mockAsyncFn)
    })

    expect(returnVal).toBe('success data')
    expect(result.current.isLoading).toBe(false)
    expect(toast.loading).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should set isLoading to true while executing', async () => {
    const { result } = renderHook(() => useLoading())
    
    let resolvePromise: (val: string) => void
    const mockAsyncFn = jest.fn().mockReturnValue(
      new Promise<string>(resolve => {
        resolvePromise = resolve
      })
    )

    let promise: Promise<string | null>
    act(() => {
      promise = result.current.withLoading(mockAsyncFn)
    })

    // Should be true while executing
    expect(result.current.isLoading).toBe(true)

    // Resolve the promise
    await act(async () => {
      resolvePromise('done')
      await promise
    })

    // Should be false after execution
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle loading and success toasts', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockAsyncFn = jest.fn().mockResolvedValue('success data')
    ;(toast.loading as jest.Mock).mockReturnValue('toast-123')

    await act(async () => {
      await result.current.withLoading(mockAsyncFn, {
        loadingMessage: 'Please wait...',
        successMessage: 'Done!'
      })
    })

    expect(toast.loading).toHaveBeenCalledWith('Please wait...')
    expect(toast.success).toHaveBeenCalledWith('Done!')
  })

  it('should use default success message if loadingMessage was provided but successMessage was not', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockAsyncFn = jest.fn().mockResolvedValue('success data')
    ;(toast.loading as jest.Mock).mockReturnValue('toast-123')

    await act(async () => {
      await result.current.withLoading(mockAsyncFn, {
        loadingMessage: 'Please wait...'
      })
    })

    expect(toast.loading).toHaveBeenCalledWith('Please wait...')
    expect(toast.success).toHaveBeenCalledWith('Operation completed successfully')
  })

  it('should only show success message if no loading message was provided', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockAsyncFn = jest.fn().mockResolvedValue('success data')

    await act(async () => {
      await result.current.withLoading(mockAsyncFn, {
        successMessage: 'Done!'
      })
    })

    expect(toast.loading).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Done!')
  })

  it('should handle errors with default error message', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockError = new Error('API failed')
    const mockAsyncFn = jest.fn().mockRejectedValue(mockError)

    let returnVal
    await act(async () => {
      returnVal = await result.current.withLoading(mockAsyncFn)
    })

    expect(returnVal).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(toast.error).toHaveBeenCalledWith(mockError)
  })

  it('should handle errors with custom error message', async () => {
    const { result } = renderHook(() => useLoading())
    
    const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Internal failure'))

    await act(async () => {
      await result.current.withLoading(mockAsyncFn, {
        errorMessage: 'Custom error message'
      })
    })

    expect(result.current.isLoading).toBe(false)
    // The hook converts the string message to an Error object before passing to toast.error
    expect(toast.error).toHaveBeenCalledWith(new Error('Custom error message'))
  })
})
