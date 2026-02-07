'use client'

import { FileAttachment } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api-client'

interface FileAttachmentListProps {
  files: FileAttachment[]
}

export function FileAttachmentList({ files }: FileAttachmentListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files attached yet. Upload one to get started.
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    return '📎'
  }

  const handleDownload = async (file: FileAttachment) => {
    try {
      const response = await apiClient.get(`/api/files/${file.id}`, {
        responseType: 'blob',
      })

      // Create a blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.original_filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file. Please try again.')
    }
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card key={file.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.original_filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(file.created_at)}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(file)}
                className="flex-shrink-0"
              >
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
