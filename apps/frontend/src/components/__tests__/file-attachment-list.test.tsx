import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FileAttachmentList } from '../file-attachment-list'
import { FileAttachment } from '@/types'
import apiClient from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

describe('FileAttachmentList', () => {
  const mockFiles: FileAttachment[] = [
    {
      id: 1,
      collaboration_id: 1,
      file_path: '/uploads/contract.pdf',
      file_type: 'application/pdf',
      original_filename: 'contract.pdf',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      collaboration_id: 1,
      file_path: '/uploads/campaign-brief.docx',
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      original_filename: 'campaign-brief.docx',
      created_at: '2024-01-16T14:30:00Z',
    },
    {
      id: 3,
      collaboration_id: 1,
      file_path: '/uploads/product-image.jpg',
      file_type: 'image/jpeg',
      original_filename: 'product-image.jpg',
      created_at: '2024-01-17T09:15:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  describe('Rendering', () => {
    it('should display empty state when no files', () => {
      render(<FileAttachmentList files={[]} />)

      expect(
        screen.getByText('No files attached yet. Upload one to get started.')
      ).toBeInTheDocument()
    })

    it('should display all files', () => {
      render(<FileAttachmentList files={mockFiles} />)

      expect(screen.getByText('contract.pdf')).toBeInTheDocument()
      expect(screen.getByText('campaign-brief.docx')).toBeInTheDocument()
      expect(screen.getByText('product-image.jpg')).toBeInTheDocument()
    })

    it('should display file upload dates', () => {
      render(<FileAttachmentList files={mockFiles} />)

      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 16, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 17, 2024/i)).toBeInTheDocument()
    })

    it('should display download buttons for all files', () => {
      render(<FileAttachmentList files={mockFiles} />)

      const downloadButtons = screen.getAllByRole('button', { name: /Download/i })
      expect(downloadButtons).toHaveLength(3)
    })
  })

  describe('File Icons', () => {
    it('should display PDF icon for PDF files', () => {
      const pdfFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/document.pdf',
          file_type: 'application/pdf',
          original_filename: 'document.pdf',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={pdfFile} />)
      expect(screen.getByText('📄')).toBeInTheDocument()
    })

    it('should display image icon for image files', () => {
      const imageFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/photo.jpg',
          file_type: 'image/jpeg',
          original_filename: 'photo.jpg',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={imageFile} />)
      expect(screen.getByText('🖼️')).toBeInTheDocument()
    })

    it('should display video icon for video files', () => {
      const videoFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/video.mp4',
          file_type: 'video/mp4',
          original_filename: 'video.mp4',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={videoFile} />)
      expect(screen.getByText('🎥')).toBeInTheDocument()
    })

    it('should display document icon for Word files', () => {
      const wordFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/document.docx',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          original_filename: 'document.docx',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={wordFile} />)
      expect(screen.getByText('📝')).toBeInTheDocument()
    })

    it('should display spreadsheet icon for Excel files', () => {
      const excelFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/data.xlsx',
          file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          original_filename: 'data.xlsx',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      const { container } = render(<FileAttachmentList files={excelFile} />)
      // Check that the file name is displayed
      expect(screen.getByText('data.xlsx')).toBeInTheDocument()
      // Check that an icon is present (the spreadsheet emoji should be in the DOM)
      expect(container.textContent).toContain('📊')
    })

    it('should display generic icon for unknown file types', () => {
      const unknownFile: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/file.unknown',
          file_type: 'application/octet-stream',
          original_filename: 'file.unknown',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={unknownFile} />)
      expect(screen.getByText('📎')).toBeInTheDocument()
    })
  })

  describe('File Download', () => {
    it('should call API when download button is clicked', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' })
      mockedApiClient.get.mockResolvedValue({ data: mockBlob })

      render(<FileAttachmentList files={[mockFiles[0]]} />)

      const downloadButton = screen.getByRole('button', { name: /Download/i })
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(mockedApiClient.get).toHaveBeenCalledWith('/api/files/1', {
          responseType: 'blob',
        })
      })
    })

    it('should handle download errors gracefully', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'))
      
      // Mock console.error and alert
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()

      render(<FileAttachmentList files={[mockFiles[0]]} />)

      const downloadButton = screen.getByRole('button', { name: /Download/i })
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalledWith('Failed to download file. Please try again.')
      })

      consoleErrorSpy.mockRestore()
      alertSpy.mockRestore()
    })
  })

  describe('File Name Display', () => {
    it('should truncate long file names', () => {
      const longFileName: FileAttachment[] = [
        {
          id: 1,
          collaboration_id: 1,
          file_path: '/uploads/very-long-file-name.pdf',
          file_type: 'application/pdf',
          original_filename: 'this-is-a-very-long-file-name-that-should-be-truncated-properly.pdf',
          created_at: '2024-01-15T10:00:00Z',
        },
      ]

      render(<FileAttachmentList files={longFileName} />)

      const fileNameElement = screen.getByText(/this-is-a-very-long-file-name/)
      expect(fileNameElement).toHaveClass('truncate')
    })
  })

  describe('Multiple Files', () => {
    it('should display multiple files in order', () => {
      render(<FileAttachmentList files={mockFiles} />)

      const fileNames = screen.getAllByText(/\.(pdf|docx|jpg)$/)
      expect(fileNames).toHaveLength(3)
    })

    it('should have independent download buttons for each file', async () => {
      const mockBlob = new Blob(['file content'])
      mockedApiClient.get.mockResolvedValue({ data: mockBlob })

      render(<FileAttachmentList files={mockFiles} />)

      const downloadButtons = screen.getAllByRole('button', { name: /Download/i })
      
      fireEvent.click(downloadButtons[0])
      await waitFor(() => {
        expect(mockedApiClient.get).toHaveBeenCalledWith('/api/files/1', {
          responseType: 'blob',
        })
      })

      fireEvent.click(downloadButtons[1])
      await waitFor(() => {
        expect(mockedApiClient.get).toHaveBeenCalledWith('/api/files/2', {
          responseType: 'blob',
        })
      })
    })
  })
})
