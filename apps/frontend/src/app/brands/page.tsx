'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import apiClient from '@/lib/api-client'
import { Brand, BrandCreateRequest, BrandUpdateRequest } from '@/types'
import { AlertCircle, Plus, Search, Edit, Trash2, Building2, Mail, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BrandsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<BrandCreateRequest>({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_channel: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    // Filter brands based on search query
    if (searchQuery.trim() === '') {
      setFilteredBrands(brands)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(query) ||
          brand.contact_name?.toLowerCase().includes(query) ||
          brand.contact_email?.toLowerCase().includes(query)
      )
      setFilteredBrands(filtered)
    }
  }, [searchQuery, brands])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<Brand[]>('/api/brands')
      setBrands(response.data)
      setFilteredBrands(response.data)
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (data: BrandCreateRequest | BrandUpdateRequest): boolean => {
    const errors: Record<string, string> = {}
    
    if ('name' in data && !data.name?.trim()) {
      errors.name = 'Brand name is required'
    }
    
    if (data.contact_email && data.contact_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.contact_email)) {
        errors.contact_email = 'Invalid email format'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateBrand = async () => {
    if (!validateForm(formData)) return
    
    try {
      setSubmitting(true)
      await apiClient.post('/api/brands', formData)
      setIsCreateDialogOpen(false)
      resetForm()
      fetchBrands()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to create brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBrand = async () => {
    if (!selectedBrand || !validateForm(formData)) return
    
    try {
      setSubmitting(true)
      await apiClient.put(`/api/brands/${selectedBrand.id}`, formData)
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedBrand(null)
      fetchBrands()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to update brand')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBrand = async () => {
    if (!selectedBrand) return
    
    try {
      setSubmitting(true)
      await apiClient.delete(`/api/brands/${selectedBrand.id}`)
      setIsDeleteDialogOpen(false)
      setSelectedBrand(null)
      fetchBrands()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to delete brand')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (brand: Brand) => {
    setSelectedBrand(brand)
    setFormData({
      name: brand.name,
      contact_name: brand.contact_name || '',
      contact_email: brand.contact_email || '',
      contact_channel: brand.contact_channel || '',
      notes: brand.notes || '',
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (brand: Brand) => {
    setSelectedBrand(brand)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      contact_channel: '',
      notes: '',
    })
    setFormErrors({})
  }

  const handleInputChange = (field: keyof BrandCreateRequest, value: string) => {
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

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Brands</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your brand contacts and partnerships
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Dashboard
              </Button>
              <Button
                onClick={openCreateDialog}
                className="flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search brands by name, contact name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
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
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  className="mt-4"
                  size="sm"
                >
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

          {/* Brands List */}
          {!loading && (
            <>
              {filteredBrands.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery ? 'No brands found' : 'No brands yet'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {searchQuery
                          ? 'Try adjusting your search query'
                          : 'Get started by adding your first brand contact'}
                      </p>
                      {!searchQuery && (
                        <Button onClick={openCreateDialog}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Brand
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBrands.map((brand) => (
                    <Card key={brand.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{brand.name}</CardTitle>
                            {brand.contact_name && (
                              <CardDescription className="mt-1">
                                {brand.contact_name}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(brand)}
                              className="h-8 w-8 p-0"
                              data-testid={`edit-brand-${brand.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(brand)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`delete-brand-${brand.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {brand.contact_email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{brand.contact_email}</span>
                            </div>
                          )}
                          {brand.contact_channel && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MessageSquare className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{brand.contact_channel}</span>
                            </div>
                          )}
                          {brand.notes && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                              {brand.notes}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Brand Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Create a new brand contact. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Nike, Adidas"
                className="h-12"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-contact-name">Contact Person Name</Label>
              <Input
                id="create-contact-name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="e.g., John Doe"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-contact-email">Contact Email</Label>
              <Input
                id="create-contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="e.g., john@brand.com"
                className="h-12"
              />
              {formErrors.contact_email && (
                <p className="text-sm text-red-600">{formErrors.contact_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-contact-channel">Contact Channel</Label>
              <Input
                id="create-contact-channel"
                value={formData.contact_channel}
                onChange={(e) => handleInputChange('contact_channel', e.target.value)}
                placeholder="e.g., Instagram, WhatsApp, Email"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-notes">Notes</Label>
              <Textarea
                id="create-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this brand..."
                rows={4}
              />
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
              onClick={handleCreateBrand}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Creating...' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>
              Update the brand details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Nike, Adidas"
                className="h-12"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-name">Contact Person Name</Label>
              <Input
                id="edit-contact-name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="e.g., John Doe"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-email">Contact Email</Label>
              <Input
                id="edit-contact-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="e.g., john@brand.com"
                className="h-12"
              />
              {formErrors.contact_email && (
                <p className="text-sm text-red-600">{formErrors.contact_email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-channel">Contact Channel</Label>
              <Input
                id="edit-contact-channel"
                value={formData.contact_channel}
                onChange={(e) => handleInputChange('contact_channel', e.target.value)}
                placeholder="e.g., Instagram, WhatsApp, Email"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this brand..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBrand}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Updating...' : 'Update Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBrand}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Deleting...' : 'Delete Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
