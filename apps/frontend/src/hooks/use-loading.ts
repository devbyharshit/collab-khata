import { useState, useCallback } from 'react'
import { toast } from '@/lib/toast'

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false)

  const withLoading = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: {
        loadingMessage?: string
        successMessage?: string
        errorMessage?: string
      }
    ): Promise<T | null> => {
      setIsLoading(true)
      let toastId: string | number | undefined

      if (options?.loadingMessage) {
        toastId = toast.loading(options.loadingMessage)
      }

      try {
        const result = await asyncFn()
        
        if (toastId) {
          toast.success(options?.successMessage || 'Operation completed successfully')
        } else if (options?.successMessage) {
          toast.success(options.successMessage)
        }

        return result
      } catch (error) {
        if (options?.errorMessage) {
          toast.error(new Error(options.errorMessage))
        } else {
          toast.error(error)
        }
        return null
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { isLoading, withLoading, setIsLoading }
}
