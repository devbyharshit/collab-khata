import { toast as sonnerToast } from 'sonner'
import { getErrorMessage } from './api-client'

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message)
  },

  error: (error: unknown) => {
    const message = getErrorMessage(error)
    sonnerToast.error(message)
  },

  info: (message: string) => {
    sonnerToast.info(message)
  },

  warning: (message: string) => {
    sonnerToast.warning(message)
  },

  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error: (err) => {
        if (typeof error === 'function') {
          return error(err)
        }
        return getErrorMessage(err)
      },
    })
  },
}
