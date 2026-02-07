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
import { Textarea } from '@/components/ui/textarea'
import { PaymentExpectationCreateRequest } from '@/types'

interface PaymentExpectationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PaymentExpectationCreateRequest) => Promise<void>
  currency?: string
}

export function PaymentExpectationModal({
  open,
  onOpenChange,
  onSubmit,
  currency = 'INR',
}: PaymentExpectationModalProps) {
  const [formData, setFormData] = useState<PaymentExpectationCreateRequest>({
    expected_amount: 0,
    promised_date: '',
    payment_method: '',
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      expected_amount: 0,
      promised_date: '',
      payment_method: '',
      notes: '',
    })
    setFormErrors({})
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.expected_amount || formData.expected_amount <= 0) {
      errors.expected_amount = 'Amount must be greater than 0'
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              Expected Amount ({currency}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.expected_amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  expected_amount: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0"
              className="h-12 text-base"
              disabled={submitting}
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
              value={formData.promised_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, promised_date: e.target.value }))
              }
              className="h-12 text-base"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Input
              id="payment-method"
              value={formData.payment_method}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, payment_method: e.target.value }))
              }
              placeholder="e.g., Bank Transfer, UPI, PayPal"
              className="h-12 text-base"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea
              id="payment-notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes..."
              rows={3}
              className="text-base"
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
            {submitting ? 'Adding...' : 'Add Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
