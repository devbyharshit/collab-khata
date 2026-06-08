'use client'

import { AuthGuard } from '@/components/auth-guard'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCardSkeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { DashboardResponse } from '@/types'
import { AlertCircle, Briefcase, Clock, IndianRupee, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      <div className="w-full space-y-6">
        {/* Header */}
        <PageHeader 
          title={`Welcome back, ${user?.email || 'User'}`} 
          description="Plan, prioritize, and accomplish your tasks with ease." 
        />

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && (
                        <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 text-red-800">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="font-semibold">{error}</p>
              </div>
              <Button 
                onClick={fetchDashboardData} 
                variant="outline" 
                className="bg-white border-red-200 text-red-700 hover:bg-red-50 rounded-2xl shadow-sm w-full sm:w-auto"
              >
                Retry Request
              </Button>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && !error && dashboardData && (
            <>
              {dashboardData.financial_summary.overdue_count > 0 && (
                <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-red-800 font-semibold">Overdue Payments Alert</h3>
                      <p className="text-sm text-red-600">
                        You have {dashboardData.financial_summary.overdue_count} payment{dashboardData.financial_summary.overdue_count === 1 ? '' : 's'} past {dashboardData.financial_summary.overdue_count === 1 ? 'its' : 'their'} promised date.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Expected */}
                <Card className="bg-primary text-primary-foreground border-none rounded-[2rem] shadow-soft-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/80 font-medium">
                      <TrendingUp className="h-4 w-4" />
                      Total Expected
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-white tracking-tight">
                      {formatCurrency(
                        dashboardData.financial_summary.total_expected,
                        dashboardData.financial_summary.currency
                      )}
                    </div>
                    <p className="text-sm font-medium text-primary-foreground/70 mt-2 flex items-center gap-1">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">↑</span> 
                      Across all collaborations
                    </p>
                  </CardContent>
                </Card>

                {/* Total Credited */}
                <Card className="bg-white border-none rounded-[2rem] shadow-soft-md relative overflow-hidden">
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
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
                    <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-1">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">↑</span> 
                      Payments received
                    </p>
                  </CardContent>
                </Card>

                {/* Pending Amount */}
                <Card className="bg-white border-none rounded-[2rem] shadow-soft-md relative overflow-hidden">
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
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
                    <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-1">
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">↑</span> 
                      Awaiting payment
                    </p>
                  </CardContent>
                </Card>

                {/* Total Collaborations */}
                <Card className="bg-white border-none rounded-[2rem] shadow-soft-md relative overflow-hidden">
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                      <Briefcase className="h-4 w-4" />
                      Total Collaborations
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-gray-900 tracking-tight">
                      {dashboardData.total_collaborations}
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-2 flex items-center gap-1">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">↑</span> 
                      Active partnerships
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Collaboration Status Distribution */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft hover:shadow-soft-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Collaboration Status Distribution</CardTitle>
                  <CardDescription>
                    Overview of your collaborations by current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
{dashboardData.collaboration_status_counts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">No collaborations yet.</p>
                      <p className="text-xs mt-1 opacity-70">Start by creating your first collaboration!</p>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-end justify-between gap-2 h-64 w-full">
                      {(() => {
                        const maxCount = Math.max(...dashboardData.collaboration_status_counts.map(s => s.count), 1);
                        return dashboardData.collaboration_status_counts.map((statusCount) => {
                          const percentage = Math.max((statusCount.count / maxCount) * 100, 8); // Minimum 8% height so it's visible
                          
                          // Determine colors based on status matching the Soft UI theme
                          let barColor = 'bg-gray-200';
                          if (['Closed', 'Paid'].includes(statusCount.status)) barColor = 'bg-primary';
                          else if (['Confirmed', 'InProduction', 'Posted'].includes(statusCount.status)) barColor = 'bg-secondary';
                          else if (['Overdue'].includes(statusCount.status)) barColor = 'bg-orange-400';
                          else if (['Negotiating'].includes(statusCount.status)) barColor = 'bg-blue-300';
                          
                          return (
                            <div key={statusCount.status} className="flex flex-col items-center gap-3 w-full group relative">
                              {/* Floating tooltip/count */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-10">
                                {statusCount.count} {statusCount.count === 1 ? 'Collab' : 'Collabs'}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                              
                              {/* The Bar Track */}
                              <div className="relative w-full max-w-[3.5rem] h-48 bg-gray-100/80 rounded-full overflow-hidden flex items-end justify-center group-hover:bg-gray-200/80 transition-colors">
                                {/* The Active Fill */}
                                <div 
                                  className={`w-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
                                  style={{ height: `${percentage}%` }}
                                />
                              </div>
                              
                              {/* Label */}
                              <span 
                                className="text-[11px] font-semibold text-gray-500 truncate w-full text-center px-1" 
                                title={getStatusLabel(statusCount.status)}
                              >
                                {getStatusLabel(statusCount.status).replace('Payment ', 'Pay ')}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
</CardContent>
              </Card>
            </>
          )}
      </div>
    </AuthGuard>
  )
}
