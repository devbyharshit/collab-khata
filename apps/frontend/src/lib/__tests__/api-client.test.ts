import { getErrorMessage, isApiError } from '../api-client'
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
