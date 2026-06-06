'use client'

import { AuthGuard } from '@/components/auth-guard'
import { BrandAutocomplete } from '@/components/brand-autocomplete'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import apiClient from '@/lib/api-client'
import {
  Brand,
  Collaboration,
  CollaborationCreateRequest,
  CollaborationStatus,
} from '@/types'
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CircleDollarSign,
  Eye,
  Filter,
  Plus,
  Search
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STATUS_COLORS: Record<CollaborationStatus, string> = {
  [CollaborationStatus.Lead]: 'bg-gray-100 text-gray-800',
  [CollaborationStatus.Negotiating]: 'bg-blue-100 text-blue-800',
  [CollaborationStatus.Confirmed]: 'bg-green-100 text-green-800',
  [CollaborationStatus.InProduction]: 'bg-yellow-100 text-yellow-800',
  [CollaborationStatus.Posted]: 'bg-purple-100 text-purple-800',
  [CollaborationStatus.PaymentPending]: 'bg-orange-100 text-orange-800',
  [CollaborationStatus.Overdue]: 'bg-red-100 text-red-800',
  [CollaborationStatus.Paid]: 'bg-emerald-100 text-emerald-800',
  [CollaborationStatus.Closed]: 'bg-slate-100 text-slate-800',
}

export default function CollaborationsPage() {
  const router = useRouter()
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [filteredCollaborations, setFilteredCollaborations] = useState<Collaboration[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState<CollaborationCreateRequest>({
    brand_id: 0,
    title: '',
    platform: '',
    deliverables_text: '',
    agreed_amount: undefined,
    currency: 'INR',
    deadline_date: '',
    status: CollaborationStatus.Lead,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter collaborations based on search query and status
    // Ensure collaborations is always an array
    if (!Array.isArray(collaborations)) {
      setFilteredCollaborations([])
      return
    }
    
    let filtered = collaborations

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((collab) => collab.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (collab) =>
          collab.title.toLowerCase().includes(query) ||
          collab.platform.toLowerCase().includes(query) ||
          collab.brand?.name.toLowerCase().includes(query)
      )
    }

    setFilteredCollaborations(filtered)
  }, [searchQuery, statusFilter, collaborations])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<{ collaborations: Collaboration[], total_count: number, filtered_count: number }>('/api/collaborations')
      
      const collabsData = Array.isArray(response.data?.collaborations) 
        ? response.data.collaborations 
        : []
      
      setCollaborations(collabsData)
      setFilteredCollaborations(collabsData)
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to load collaborations')
      setCollaborations([])
      setFilteredCollaborations([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBrandsIfNeeded = async () => {
    if (brands.length === 0) {
      try {
        const response = await apiClient.get<Brand[]>('/api/brands')
        const brandsData = Array.isArray(response.data) ? response.data : []
        setBrands(brandsData)
      } catch (err) {
        console.error('Failed to load brands', err)
      }
    }
  }

  const validateForm = (data: CollaborationCreateRequest): boolean => {
    const errors: Record<string, string> = {}

    if (!data.brand_id || data.brand_id === 0) {
      errors.brand_id = 'Please select a brand'
    }

    if (!data.title?.trim()) {
      errors.title = 'Title is required'
    }

    if (!data.platform?.trim()) {
      errors.platform = 'Platform is required'
    }

    if (data.agreed_amount !== undefined && data.agreed_amount < 0) {
      errors.agreed_amount = 'Amount must be positive'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateCollaboration = async () => {
    if (!validateForm(formData)) return

    try {
      setSubmitting(true)
      await apiClient.post('/api/collaborations', formData)
      setIsCreateDialogOpen(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to create collaboration')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateDialog = async () => {
    resetForm()
    setIsCreateDialogOpen(true)
    await fetchBrandsIfNeeded()
  }

  const resetForm = () => {
    setFormData({
      brand_id: 0,
      title: '',
      platform: '',
      deliverables_text: '',
      agreed_amount: undefined,
      currency: 'INR',
      deadline_date: '',
      status: CollaborationStatus.Lead,
    })
    setFormErrors({})
  }

  const handleInputChange = (field: keyof CollaborationCreateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (amount === undefined) return 'Not specified'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="w-full space-y-6">
          {/* Header */}
          <PageHeader 
          title="Collaborations" 
          description="Track and manage your brand partnerships." 
          action={
            <Button onClick={openCreateDialog} className="w-full sm:w-auto rounded-full h-12 px-6">
              <Plus className="h-4 w-4 mr-2" /> New Collab
            </Button>
          }
        />

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by title, platform, or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(CollaborationStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Card className="border-red-200 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">{error}</p>
                </div>
                <Button onClick={() => setError(null)} variant="outline" className="mt-4" size="sm">
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Collaborations List */}
          {!loading && (
            <>
              {filteredCollaborations.length === 0 ? (
                <div className="w-full bg-white border-none rounded-[2.5rem] shadow-soft p-12 md:p-20 flex flex-col items-center justify-center text-center mt-6">
                  <div className="h-24 w-24 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No collaborations found'
                      : 'No collaborations yet'}
                  </h3>
                  <p className="text-gray-500 max-w-sm mb-8 text-base">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your filters to find what you are looking for.'
                      : 'Get started by creating your first collaboration. Manage your pipeline easily.'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-white rounded-full h-14 px-8 text-base shadow-soft-md">
                      <Plus className="h-5 w-5 mr-2" />
                      Create First Collaboration
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredCollaborations.map((collab) => (
                    <Card
                      key={collab.id}
                      className="hover:shadow-soft-md transition-shadow cursor-pointer border-none bg-white rounded-[2rem] shadow-soft"
                      onClick={() => router.push(`/collaborations/${collab.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{collab.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {collab.brand?.name || 'Unknown Brand'}
                            </CardDescription>
                          </div>
                          <Badge className={STATUS_COLORS[collab.status]}>{collab.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{collab.platform}</span>
                          </div>
                          {collab.agreed_amount !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CircleDollarSign className="h-4 w-4 flex-shrink-0" />
                              <span>{formatCurrency(collab.agreed_amount, collab.currency)}</span>
                            </div>
                          )}
                          {collab.deadline_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>Deadline: {formatDate(collab.deadline_date)}</span>
                            </div>
                          )}
                          {collab.deliverables_text && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                              {collab.deliverables_text}
                            </p>
                          )}
                          <div className="pt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/collaborations/${collab.id}`)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      {/* Create Collaboration Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Collaboration</DialogTitle>
            <DialogDescription>
              Add a new brand collaboration. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-brand">
                Brand <span className="text-red-500">*</span>
              </Label>
              <BrandAutocomplete
                brands={brands}
                value={formData.brand_id}
                onChange={(value) => handleInputChange('brand_id', value)}
                onBrandCreated={(newBrand) => {
                  setBrands(prev => [newBrand, ...prev])
                }}
              />
              {formErrors.brand_id && (
                <p className="text-sm text-red-600">{formErrors.brand_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Summer Campaign 2024"
                className="h-12"
              />
              {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-platform">
                Platform <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-platform"
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                placeholder="e.g., Instagram, YouTube, TikTok"
                className="h-12"
              />
              {formErrors.platform && (
                <p className="text-sm text-red-600">{formErrors.platform}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-amount">Agreed Amount</Label>
                <Input
                  id="create-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.agreed_amount || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'agreed_amount',
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="0"
                  className="h-12"
                />
                {formErrors.agreed_amount && (
                  <p className="text-sm text-red-600">{formErrors.agreed_amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger id="create-currency" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-deadline">Deadline Date</Label>
              <Input
                id="create-deadline"
                type="date"
                value={formData.deadline_date}
                onChange={(e) => handleInputChange('deadline_date', e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-deliverables">Deliverables</Label>
              <Textarea
                id="create-deliverables"
                value={formData.deliverables_text}
                onChange={(e) => handleInputChange('deliverables_text', e.target.value)}
                placeholder="Describe what needs to be delivered..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value as CollaborationStatus)}
              >
                <SelectTrigger id="create-status" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CollaborationStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollaboration}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Creating...' : 'Create Collaboration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
