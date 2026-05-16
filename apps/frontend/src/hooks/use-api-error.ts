import { useState } from 'react'
import { getErrorMessage } from '@/lib/api-client'

export function useApiError() {
  const [error, setError] = useState<string | null>(null)

  const handleError = (err: unknown) => {
    setError(getErrorMessage(err))
  }

  const clearError = () => setError(null)

  return { error, handleError, clearError }
}
