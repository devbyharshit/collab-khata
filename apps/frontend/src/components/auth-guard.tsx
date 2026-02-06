'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true,
  redirectTo 
}: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        // User needs to be authenticated but isn't
        router.push(redirectTo || '/auth/login')
      } else if (!requireAuth && isAuthenticated) {
        // User shouldn't be authenticated but is (e.g., on login page)
        router.push(redirectTo || '/dashboard')
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if authentication state doesn't match requirement
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
