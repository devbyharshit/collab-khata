'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { DashboardResponse } from '@/types'
import { AlertCircle, TrendingUp, IndianRupee, Clock, Briefcase } from 'lucide-react'
import { DashboardCardSkeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/toast'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<DashboardResponse>('/api/dashboard')
      setDashboardData(response.data)
    } catch (err: any) {
      const errorMessage = err?.error?.message || 'Failed to load dashboard data'
      setError(errorMessage)
      toast.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Lead: 'bg-gray-100 text-gray-800',
      Negotiating: 'bg-blue-100 text-blue-800',
      Confirmed: 'bg-green-100 text-green-800',
      InProduction: 'bg-yellow-100 text-yellow-800',
      Posted: 'bg-purple-100 text-purple-800',
      PaymentPending: 'bg-orange-100 text-orange-800',
      Overdue: 'bg-red-100 text-red-800',
      Paid: 'bg-emerald-100 text-emerald-800',
      Closed: 'bg-slate-100 text-slate-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      Lead: 'Lead',
      Negotiating: 'Negotiating',
      Confirmed: 'Confirmed',
      InProduction: 'In Production',
      Posted: 'Posted',
      PaymentPending: 'Payment Pending',
      Overdue: 'Overdue',
      Paid: 'Paid',
      Closed: 'Closed',
    }
    return labels[status] || status
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user?.email}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">{error}</p>
                </div>
                <Button 
                  onClick={fetchDashboardData} 
                  variant="outline" 
                  className="mt-4"
                  size="sm"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          {!loading && !error && dashboardData && (
            <>
              {/* Overdue Payments Alert */}
              {dashboardData.financial_summary.overdue_count > 0 && (
                <Card className="border-orange-200 bg-orange-50 mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900">
                          Overdue Payments Alert
                        </h3>
                        <p className="text-sm text-orange-800 mt-1">
                          You have {dashboardData.financial_summary.overdue_count} payment
                          {dashboardData.financial_summary.overdue_count === 1 ? '' : 's'} past 
                          {dashboardData.financial_summary.overdue_count === 1 ? ' its' : ' their'} promised date. 
                          Consider following up with the brand{dashboardData.financial_summary.overdue_count === 1 ? '' : 's'}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Expected */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Total Expected
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        dashboardData.financial_summary.total_expected,
                        dashboardData.financial_summary.currency
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Across all collaborations
                    </p>
                  </CardContent>
                </Card>

                {/* Total Credited */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IndianRupee className="h-4 w-4" />
                      Total Credited
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        dashboardData.financial_summary.total_credited,
                        dashboardData.financial_summary.currency
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Payments received
                    </p>
                  </CardContent>
                </Card>

                {/* Pending Amount */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Pending Amount
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(
                        dashboardData.financial_summary.pending_amount,
                        dashboardData.financial_summary.currency
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Awaiting payment
                    </p>
                  </CardContent>
                </Card>

                {/* Total Collaborations */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      Total Collaborations
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {dashboardData.total_collaborations}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Active partnerships
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Collaboration Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collaboration Status Distribution</CardTitle>
                  <CardDescription>
                    Overview of your collaborations by current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData.collaboration_status_counts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No collaborations yet. Start by creating your first collaboration!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.collaboration_status_counts.map((statusCount) => (
                        <div
                          key={statusCount.status}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                statusCount.status
                              )}`}
                            >
                              {getStatusLabel(statusCount.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {statusCount.count}
                            </span>
                            <span className="text-sm text-gray-500">
                              collaboration{statusCount.count === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
