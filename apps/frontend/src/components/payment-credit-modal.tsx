'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PaymentCreditCreateRequest, PaymentExpectation } from '@/types'

interface PaymentCreditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PaymentCreditCreateRequest) => Promise<void>
  paymentExpectation: PaymentExpectation | null
  currency?: string
}

export function PaymentCreditModal({
  open,
  onOpenChange,
  onSubmit,
  paymentExpectation,
  currency = 'INR',
}: PaymentCreditModalProps) {
  const [formData, setFormData] = useState<PaymentCreditCreateRequest>({
    credited_amount: 0,
    credited_date: new Date().toISOString().split('T')[0],
    reference_note: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Calculate remaining balance
  const remainingBalance =
    paymentExpectation
      ? paymentExpectation.expected_amount - (paymentExpectation.total_credited || 0)
      : 0

  // Calculate new balance after this credit
  const newBalance = remainingBalance - formData.credited_amount

  useEffect(() => {
    // Reset form when modal opens with new payment expectation
    if (open && paymentExpectation) {
      setFormData({
        credited_amount: 0,
        credited_date: new Date().toISOString().split('T')[0],
        reference_note: '',
      })
      setFormErrors({})
    }
  }, [open, paymentExpectation])

  const resetForm = () => {
    setFormData({
      credited_amount: 0,
      credited_date: new Date().toISOString().split('T')[0],
      reference_note: '',
    })
    setFormErrors({})
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !submitting) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.credited_amount || formData.credited_amount <= 0) {
      errors.credited_amount = 'Amount must be greater than 0'
    }

    if (!formData.credited_date) {
      errors.credited_date = 'Date is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      await onSubmit(formData)
      resetForm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by parent component
    } finally {
      setSubmitting(false)
    }
  }

  if (!paymentExpectation) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment Credit</DialogTitle>
          <DialogDescription>
            Record a payment received for this expectation. Supports partial payments.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expected Amount</span>
              <span className="font-semibold">
                {formatCurrency(paymentExpectation.expected_amount)}
              </span>
            </div>
            {paymentExpectation.total_credited !== undefined &&
              paymentExpectation.total_credited > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Already Credited</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(paymentExpectation.total_credited)}
                  </span>
                </div>
              )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Remaining Balance</span>
              <span className="font-bold text-lg">{formatCurrency(remainingBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge
                variant="outline"
                className={
                  paymentExpectation.status === 'Completed'
                    ? 'bg-green-50 text-green-700'
                    : paymentExpectation.status === 'Overdue'
                    ? 'bg-red-50 text-red-700'
                    : paymentExpectation.status === 'Partial'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-gray-50 text-gray-700'
                }
              >
                {paymentExpectation.status}
              </Badge>
            </div>
          </div>

          {/* Credit Form */}
          <div className="space-y-2">
            <Label htmlFor="credit-amount">
              Credited Amount ({currency}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="credit-amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.credited_amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  credited_amount: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0"
              className="h-12 text-base"
              disabled={submitting}
            />
            {formErrors.credited_amount && (
              <p className="text-sm text-red-600">{formErrors.credited_amount}</p>
            )}
          </div>

          {/* Balance Calculation Display */}
          {formData.credited_amount > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-900">New Balance After Credit</span>
                <span
                  className={`font-semibold ${
                    newBalance <= 0 ? 'text-green-600' : 'text-blue-900'
                  }`}
                >
                  {formatCurrency(Math.max(0, newBalance))}
                </span>
              </div>
              {newBalance <= 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Payment will be marked as completed
                </p>
              )}
              {newBalance > 0 && (
                <p className="text-xs text-blue-700 mt-1">Payment will be marked as partial</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="credit-date">
              Credited Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="credit-date"
              type="date"
              value={formData.credited_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, credited_date: e.target.value }))
              }
              className="h-12 text-base"
              disabled={submitting}
            />
            {formErrors.credited_date && (
              <p className="text-sm text-red-600">{formErrors.credited_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit-reference">Reference Note</Label>
            <Input
              id="credit-reference"
              value={formData.reference_note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reference_note: e.target.value }))
              }
              placeholder="e.g., Transaction ID, Invoice number"
              className="h-12 text-base"
              disabled={submitting}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto h-12 text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto h-12 text-base"
          >
            {submitting ? 'Recording...' : 'Record Credit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
