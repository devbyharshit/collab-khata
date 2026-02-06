import { useState } from 'react'
import { ApiError } from '@/types'

export function useApiError() {
  const [error, setError] = useState<string | null>(null)

  const handleError = (err: unknown) => {
    if (isApiError(err)) {
      setError(err.error.message)
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unexpected error occurred')
    }
  }

  const clearError = () => setError(null)

  return { error, handleError, clearError }
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object' &&
    'message' in (error as any).error
  )
}
