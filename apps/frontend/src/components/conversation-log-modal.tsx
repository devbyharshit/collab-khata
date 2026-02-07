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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConversationLogCreateRequest, CommunicationChannel } from '@/types'

interface ConversationLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ConversationLogCreateRequest) => Promise<void>
}

export function ConversationLogModal({
  open,
  onOpenChange,
  onSubmit,
}: ConversationLogModalProps) {
  const [formData, setFormData] = useState<ConversationLogCreateRequest>({
    channel: CommunicationChannel.Email,
    message_text: '',
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
      channel: CommunicationChannel.Email,
      message_text: '',
    })
    setFormErrors({})
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.message_text || formData.message_text.trim() === '') {
      errors.message_text = 'Message text is required'
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
          <DialogTitle>Add Conversation Log</DialogTitle>
          <DialogDescription>
            Record a conversation or communication with the brand.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="conversation-channel">
              Communication Channel <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.channel}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, channel: value as CommunicationChannel }))
              }
              disabled={submitting}
            >
              <SelectTrigger id="conversation-channel" className="h-12 text-base">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CommunicationChannel.Email}>Email</SelectItem>
                <SelectItem value={CommunicationChannel.Instagram}>Instagram</SelectItem>
                <SelectItem value={CommunicationChannel.WhatsApp}>WhatsApp</SelectItem>
                <SelectItem value={CommunicationChannel.Phone}>Phone</SelectItem>
                <SelectItem value={CommunicationChannel.InPerson}>In Person</SelectItem>
                <SelectItem value={CommunicationChannel.Other}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversation-message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="conversation-message"
              value={formData.message_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message_text: e.target.value }))
              }
              placeholder="Enter conversation details or summary..."
              rows={5}
              className="text-base"
              disabled={submitting}
            />
            {formErrors.message_text && (
              <p className="text-sm text-red-600">{formErrors.message_text}</p>
            )}
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
            {submitting ? 'Adding...' : 'Add Conversation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
