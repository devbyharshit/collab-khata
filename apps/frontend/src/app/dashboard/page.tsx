'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-muted-foreground">
              Dashboard content will be implemented in future tasks.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
