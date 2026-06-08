'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import apiClient from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Collaboration,
  CollaborationStatus,
  CollaborationStatusUpdateRequest,
  PaymentExpectation,
  PaymentExpectationCreateRequest,
  PaymentCreditCreateRequest,
  ConversationLog,
  ConversationLogCreateRequest,
  CommunicationChannel,
  FileAttachment,
} from '@/types'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  BadgeIndianRupee,
  Briefcase,
  Edit,
  MessageSquare,
  Paperclip,
  Plus,
  Download,
  Upload,
  CheckCircle,
} from 'lucide-react'

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

const STATUS_WORKFLOW = [
  CollaborationStatus.Lead,
  CollaborationStatus.Negotiating,
  CollaborationStatus.Confirmed,
  CollaborationStatus.InProduction,
  CollaborationStatus.Posted,
  CollaborationStatus.PaymentPending,
  CollaborationStatus.Overdue,
  CollaborationStatus.Paid,
  CollaborationStatus.Closed,
]

export default function CollaborationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collaborationId = parseInt(params.id as string)

  const [collaboration, setCollaboration] = useState<Collaboration | null>(null)
  const [payments, setPayments] = useState<PaymentExpectation[]>([])
  const [conversations, setConversations] = useState<ConversationLog[]>([])
  const [files, setFiles] = useState<FileAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false)
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentExpectation | null>(null)

  // Form states
  const [editFormData, setEditFormData] = useState({
    title: '',
    platform: '',
    agreed_amount: 0,
    deadline_date: '',
    deliverables_text: '',
  })
  const [statusFormData, setStatusFormData] = useState<CollaborationStatusUpdateRequest>({
    status: CollaborationStatus.Lead,
    posting_date: '',
  })
  const [paymentFormData, setPaymentFormData] = useState<PaymentExpectationCreateRequest>({
    expected_amount: 0,
    promised_date: '',
    payment_method: '',
    notes: '',
  })
  const [creditFormData, setCreditFormData] = useState<PaymentCreditCreateRequest>({
    credited_amount: 0,
    credited_date: '',
    reference_note: '',
  })
  const [conversationFormData, setConversationFormData] = useState<ConversationLogCreateRequest>({
    channel: CommunicationChannel.Email,
    message_text: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (collaborationId) {
      fetchCollaborationDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborationId])

  const fetchCollaborationDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const [collabResponse, paymentsResponse, conversationsResponse, filesResponse] =
        await Promise.all([
          apiClient.get<Collaboration>(`/api/collaborations/${collaborationId}`),
          apiClient.get<{ payment_expectations: PaymentExpectation[]; total_count: number }>(
            `/api/collaborations/${collaborationId}/payments`
          ),
          apiClient.get<ConversationLog[]>(
            `/api/collaborations/${collaborationId}/conversations`
          ),
          apiClient.get<FileAttachment[]>(`/api/collaborations/${collaborationId}/files`),
        ])
      setCollaboration(collabResponse.data)
      setPayments(
        Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : paymentsResponse.data.payment_expectations || []
      )
      setConversations(Array.isArray(conversationsResponse.data) ? conversationsResponse.data : [])
      setFiles(Array.isArray(filesResponse.data) ? filesResponse.data : [])
    } catch (err: any) {
      console.error("fetchCollaborationDetails ERROR:", err)
      setError(err?.error?.message || 'Failed to load collaboration details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!collaboration) return

    const errors: Record<string, string> = {}

    // Validate posting date for Posted status
    if (
      statusFormData.status === CollaborationStatus.Posted &&
      !statusFormData.posting_date
    ) {
      errors.posting_date = 'Posting date is required for Posted status'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.patch(`/api/collaborations/${collaborationId}/status`, statusFormData)
      setIsStatusDialogOpen(false)
      fetchCollaborationDetails()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePayment = async () => {
    const errors: Record<string, string> = {}

    if (paymentFormData.expected_amount <= 0) {
      errors.expected_amount = 'Amount must be greater than 0'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post(`/api/collaborations/${collaborationId}/payments`, paymentFormData)
      setIsPaymentDialogOpen(false)
      resetPaymentForm()
      fetchCollaborationDetails()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to create payment expectation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkFullyPaid = async (payment: PaymentExpectation) => {
    try {
      const remainingAmount = payment.expected_amount - (payment.total_credited || 0)
      if (remainingAmount <= 0) return

      const today = new Date().toISOString().split('T')[0]
      await apiClient.post(`/api/payments/${payment.id}/credits`, {
        credited_amount: remainingAmount,
        credited_date: today,
        reference_note: 'Marked as fully paid',
      })
      toast.success('Payment marked as fully paid')
      fetchCollaborationDetails()
    } catch (err: any) {
      toast.error(err?.error?.message || 'Failed to record payment')
    }
  }

  const handleCreateCredit = async () => {
    if (!selectedPayment) return

    const errors: Record<string, string> = {}

    if (creditFormData.credited_amount <= 0) {
      errors.credited_amount = 'Amount must be greater than 0'
    }

    if (!creditFormData.credited_date) {
      errors.credited_date = 'Date is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post(`/api/payments/${selectedPayment.id}/credits`, creditFormData)
      setIsCreditDialogOpen(false)
      setSelectedPayment(null)
      resetCreditForm()
      fetchCollaborationDetails()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to record payment credit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateConversation = async () => {
    const errors: Record<string, string> = {}

    if (!conversationFormData.message_text.trim()) {
      errors.message_text = 'Message is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.post(
        `/api/collaborations/${collaborationId}/conversations`,
        conversationFormData
      )
      setIsConversationDialogOpen(false)
      resetConversationForm()
      fetchCollaborationDetails()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to add conversation log')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setFormErrors({ file: 'Please select a file' })
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('file', selectedFile)

      await apiClient.post(`/api/collaborations/${collaborationId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setIsFileDialogOpen(false)
      setSelectedFile(null)
      fetchCollaborationDetails()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to upload file')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      const response = await apiClient.get(`/api/files/${fileId}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to download file')
    }
  }

  const openStatusDialog = () => {
    if (!collaboration) return
    setStatusFormData({
      status: collaboration.status,
      posting_date: collaboration.posting_date || '',
    })
    setFormErrors({})
    setIsStatusDialogOpen(true)
  }

  const openPaymentDialog = () => {
    resetPaymentForm()
    setIsPaymentDialogOpen(true)
  }

  const openCreditDialog = (payment: PaymentExpectation) => {
    setSelectedPayment(payment)
    resetCreditForm()
    setIsCreditDialogOpen(true)
  }

  const openConversationDialog = () => {
    resetConversationForm()
    setIsConversationDialogOpen(true)
  }

  const openFileDialog = () => {
    setSelectedFile(null)
    setFormErrors({})
    setIsFileDialogOpen(true)
  }

  const openEditDialog = () => {
    if (!collaboration) return
    setEditFormData({
      title: collaboration.title || '',
      platform: collaboration.platform || '',
      agreed_amount: collaboration.agreed_amount || 0,
      deadline_date: collaboration.deadline_date ? collaboration.deadline_date.split('T')[0] : '',
      deliverables_text: collaboration.deliverables_text || '',
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!editFormData.title.trim()) errors.title = 'Title is required'
    if (editFormData.agreed_amount < 0) errors.agreed_amount = 'Amount cannot be negative'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSubmitting(true)
      await apiClient.put(`/api/collaborations/${collaborationId}`, editFormData)
      setIsEditDialogOpen(false)
      fetchCollaborationDetails()
      toast.success('Collaboration updated successfully')
    } catch (err: any) {
      toast.error(err?.error?.message || 'Failed to update collaboration')
    } finally {
      setSubmitting(false)
    }
  }

  const resetPaymentForm = () => {
    setPaymentFormData({
      expected_amount: 0,
      promised_date: '',
      payment_method: '',
      notes: '',
    })
    setFormErrors({})
  }

  const resetCreditForm = () => {
    setCreditFormData({
      credited_amount: 0,
      credited_date: new Date().toISOString().split('T')[0],
      reference_note: '',
    })
    setFormErrors({})
  }

  const resetConversationForm = () => {
    setConversationFormData({
      channel: CommunicationChannel.Email,
      message_text: '',
    })
    setFormErrors({})
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNextStatuses = (currentStatus: CollaborationStatus): CollaborationStatus[] => {
    const currentIndex = STATUS_WORKFLOW.indexOf(currentStatus)
    if (currentIndex === -1) return []
    return STATUS_WORKFLOW.slice(currentIndex + 1)
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

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AuthGuard>
    )
  }

  if (!collaboration) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="w-full">
          <div className="space-y-6 w-full">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Collaboration not found</p>
                </div>
                <Button onClick={() => router.push('/collaborations')} className="mt-4">
                  Back to Collaborations
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="w-full space-y-6">
          {/* Hero Card Header */}
          <div className="relative overflow-hidden bg-primary rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(10,59,43,0.3)] border border-white/5">
            {/* Ambient Blobs */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12">
              <div className="space-y-4">
                
                {/* Pre-title Row */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/collaborations')}
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 p-0 flex items-center justify-center -ml-2 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 bg-white/10 text-white/90 border border-white/10 rounded-full text-xs font-semibold backdrop-blur-sm">
                    {collaboration.platform}
                  </span>
                  <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/30 border-none font-bold">
                    {getStatusLabel(collaboration.status)}
                  </Badge>
                </div>

                {/* Title & Brand */}
                <div className="space-y-2">
                  <h1 className="text-white font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">
                    {collaboration.title}
                  </h1>
                  <p className="text-emerald-50/80 text-lg font-medium flex items-center gap-2 mt-2">
                    <Briefcase className="h-5 w-5 opacity-70" />
                    {collaboration.brand?.name}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <Button 
                  variant="outline" 
                  onClick={openEditDialog}
                  className="w-full sm:w-auto bg-white/10 text-white font-semibold backdrop-blur-md border-white/10 h-12 px-6 rounded-full hover:bg-white/20 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
                <Button 
                  variant="default" 
                  onClick={openStatusDialog}
                  className="w-full sm:w-auto bg-secondary text-primary font-bold h-12 px-6 rounded-full shadow-[0_8px_16px_-6px_rgba(167,243,208,0.4)] hover:bg-[#8EF1C3] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Change Status
                </Button>
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Collaboration Details */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Collaboration Details</CardTitle>
                    <Button variant="outline" size="sm" onClick={openStatusDialog}>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Platform</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{collaboration.platform}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Agreed Amount</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <BadgeIndianRupee className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">
                          {formatCurrency(collaboration.agreed_amount, collaboration.currency)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Deadline</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{formatDate(collaboration.deadline_date)}</p>
                      </div>
                    </div>
                    {collaboration.posting_date && (
                      <div>
                        <Label className="text-sm text-gray-600">Posted On</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">{formatDate(collaboration.posting_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {collaboration.deliverables_text && (
                    <div>
                      <Label className="text-sm text-gray-600">Deliverables</Label>
                      <p className="mt-1 text-gray-900">{collaboration.deliverables_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Expectations */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Payment Expectations</CardTitle>
                    <Button variant="outline" size="sm" onClick={openPaymentDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <BadgeIndianRupee className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No payment expectations yet</p>
                      <Button variant="outline" size="sm" onClick={openPaymentDialog} className="mt-4">
                        Add First Payment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="border rounded-lg p-4 hover:bg-transparent transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {formatCurrency(
                                    payment.expected_amount,
                                    collaboration.currency
                                  )}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={
                                    payment.status === 'Completed'
                                      ? 'bg-green-50 text-green-700'
                                      : payment.status === 'Overdue'
                                      ? 'bg-red-50 text-red-700'
                                      : payment.status === 'Partial'
                                      ? 'bg-yellow-50 text-yellow-700'
                                      : 'bg-transparent text-gray-700'
                                  }
                                >
                                  {payment.status}
                                </Badge>
                              </div>
                              {payment.promised_date && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Due: {formatDate(payment.promised_date)}
                                </p>
                              )}
                              {payment.payment_method && (
                                <p className="text-sm text-gray-600">
                                  Method: {payment.payment_method}
                                </p>
                              )}
                              {payment.total_credited !== undefined &&
                                payment.total_credited > 0 && (
                                  <p className="text-sm text-green-600 mt-1">
                                    Credited:{' '}
                                    {formatCurrency(payment.total_credited, collaboration.currency)}
                                  </p>
                                )}
                              {payment.notes && (
                                <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {payment.expected_amount > (payment.total_credited || 0) && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleMarkFullyPaid(payment)}
                                  className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Fully Paid
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreditDialog(payment)}
                                disabled={payment.status === 'Completed'}
                              >
                                Record Partial
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Logs */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Conversation Logs</CardTitle>
                    <Button variant="outline" size="sm" onClick={openConversationDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Log
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">No conversation logs yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openConversationDialog}
                        className="mt-4"
                      >
                        Add First Log
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {conv.channel}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(conv.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{conv.message_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* File Attachments */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Files</CardTitle>
                    <Button variant="outline" size="sm" onClick={openFileDialog}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <div className="text-center py-6">
                      <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No files attached</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-transparent"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm truncate">{file.original_filename}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileDownload(file.id, file.original_filename)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white border-none rounded-[2rem] shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Total Payments</Label>
                    <p className="text-lg font-semibold">{payments.length}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-gray-600">Conversations</Label>
                    <p className="text-lg font-semibold">{conversations.length}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-gray-600">Files</Label>
                    <p className="text-lg font-semibold">{files.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Collaboration Status</DialogTitle>
            <DialogDescription>
              Change the status of this collaboration. Status transitions follow a workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-select">New Status</Label>
              <Select
                value={statusFormData.status}
                onValueChange={(value) =>
                  setStatusFormData((prev) => ({ ...prev, status: value as CollaborationStatus }))
                }
              >
                <SelectTrigger id="status-select" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={collaboration.status} disabled>
                    {collaboration.status} (Current)
                  </SelectItem>
                  {getNextStatuses(collaboration.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statusFormData.status === CollaborationStatus.Posted && (
              <div className="space-y-2">
                <Label htmlFor="posting-date">
                  Posting Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="posting-date"
                  type="date"
                  value={statusFormData.posting_date}
                  onChange={(e) =>
                    setStatusFormData((prev) => ({ ...prev, posting_date: e.target.value }))
                  }
                  className="h-12"
                />
                {formErrors.posting_date && (
                  <p className="text-sm text-red-600">{formErrors.posting_date}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Expectation Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payment Expectation</DialogTitle>
            <DialogDescription>
              Record an expected payment for this collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">
                Expected Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentFormData.expected_amount || ''}
                onChange={(e) =>
                  setPaymentFormData((prev) => ({
                    ...prev,
                    expected_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="h-12"
              />
              {formErrors.expected_amount && (
                <p className="text-sm text-red-600">{formErrors.expected_amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Promised Date</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentFormData.promised_date}
                onChange={(e) =>
                  setPaymentFormData((prev) => ({ ...prev, promised_date: e.target.value }))
                }
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Input
                id="payment-method"
                value={paymentFormData.payment_method}
                onChange={(e) =>
                  setPaymentFormData((prev) => ({ ...prev, payment_method: e.target.value }))
                }
                placeholder="e.g., Bank Transfer, UPI, PayPal"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentFormData.notes}
                onChange={(e) =>
                  setPaymentFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Adding...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Credit Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment Credit</DialogTitle>
            <DialogDescription>
              Record a payment received for this expectation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="bg-transparent p-3 rounded-lg">
                <p className="text-sm text-gray-600">Expected Amount</p>
                <p className="font-semibold">
                  {formatCurrency(selectedPayment.expected_amount, collaboration.currency)}
                </p>
                {selectedPayment.total_credited !== undefined &&
                  selectedPayment.total_credited > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Already Credited:{' '}
                      {formatCurrency(selectedPayment.total_credited, collaboration.currency)}
                    </p>
                  )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="credit-amount">
                Credited Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credit-amount"
                type="number"
                min="0"
                step="0.01"
                value={creditFormData.credited_amount || ''}
                onChange={(e) =>
                  setCreditFormData((prev) => ({
                    ...prev,
                    credited_amount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="h-12"
              />
              {formErrors.credited_amount && (
                <p className="text-sm text-red-600">{formErrors.credited_amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-date">
                Credited Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credit-date"
                type="date"
                value={creditFormData.credited_date}
                onChange={(e) =>
                  setCreditFormData((prev) => ({ ...prev, credited_date: e.target.value }))
                }
                className="h-12"
              />
              {formErrors.credited_date && (
                <p className="text-sm text-red-600">{formErrors.credited_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-reference">Reference Note</Label>
              <Input
                id="credit-reference"
                value={creditFormData.reference_note}
                onChange={(e) =>
                  setCreditFormData((prev) => ({ ...prev, reference_note: e.target.value }))
                }
                placeholder="e.g., Transaction ID, Invoice number"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCreditDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCredit}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Recording...' : 'Record Credit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversation Log Dialog */}
      <Dialog open={isConversationDialogOpen} onOpenChange={setIsConversationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Conversation Log</DialogTitle>
            <DialogDescription>
              Record a communication with the brand for this collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="conversation-channel">Channel</Label>
              <Select
                value={conversationFormData.channel}
                onValueChange={(value) =>
                  setConversationFormData((prev) => ({
                    ...prev,
                    channel: value as CommunicationChannel,
                  }))
                }
              >
                <SelectTrigger id="conversation-channel" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CommunicationChannel).map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversation-message">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="conversation-message"
                value={conversationFormData.message_text}
                onChange={(e) =>
                  setConversationFormData((prev) => ({ ...prev, message_text: e.target.value }))
                }
                placeholder="Describe the conversation..."
                rows={5}
              />
              {formErrors.message_text && (
                <p className="text-sm text-red-600">{formErrors.message_text}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsConversationDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Adding...' : 'Add Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Attach a file to this collaboration (contracts, briefs, deliverables, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">
                Select File <span className="text-red-500">*</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="h-12"
              />
              {formErrors.file && <p className="text-sm text-red-600">{formErrors.file}</p>}
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsFileDialogOpen(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleFileUpload} disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Collaboration</DialogTitle>
            <DialogDescription>
              Update the core details of this project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-xs uppercase tracking-wider font-semibold text-gray-500">Project Title <span className="text-red-500">*</span></Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
              />
              {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-platform" className="text-xs uppercase tracking-wider font-semibold text-gray-500">Platform</Label>
                <Input
                  id="edit-platform"
                  value={editFormData.platform}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, platform: e.target.value }))}
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                  placeholder="e.g. YouTube, Instagram"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-xs uppercase tracking-wider font-semibold text-gray-500">Agreed Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  value={editFormData.agreed_amount || ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, agreed_amount: parseFloat(e.target.value) || 0 }))}
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deadline" className="text-xs uppercase tracking-wider font-semibold text-gray-500">Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editFormData.deadline_date}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, deadline_date: e.target.value }))}
                className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deliverables" className="text-xs uppercase tracking-wider font-semibold text-gray-500">Deliverables</Label>
              <Textarea
                id="edit-deliverables"
                value={editFormData.deliverables_text}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, deliverables_text: e.target.value }))}
                rows={4}
                className="rounded-xl bg-gray-50 border-gray-200 focus:bg-white resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
              className="rounded-full w-full sm:w-auto border-gray-200 hover:bg-gray-50 h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={submitting}
              className="rounded-full w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-soft h-10"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
