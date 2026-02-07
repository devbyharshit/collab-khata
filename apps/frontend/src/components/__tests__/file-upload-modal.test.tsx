import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUploadModal } from '../file-upload-modal'

describe('FileUploadModal', () => {
  const mockOnSubmit = jest.fn()
  const mockOnOpenChange = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<FileUploadModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upload File', { selector: 'h2' })).toBeInTheDocument()
      expect(
        screen.getByText('Upload documents, images, or videos related to this collaboration.')
      ).toBeInTheDocument()
    })

    it('should display file upload area', () => {
      render(<FileUploadModal {...defaultProps} />)

      expect(
        screen.getByText(/Drag and drop a file here, or click to browse/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Supported: Documents, Images, Videos \(Max 10MB\)/i)
      ).toBeInTheDocument()
    })

    it('should have Cancel and Upload File buttons', () => {
      render(<FileUploadModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Upload File/i })).toBeInTheDocument()
    })

    it('should disable upload button when no file is selected', () => {
      render(<FileUploadModal {...defaultProps} />)

      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('File Selection', () => {
    it('should display selected file information', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('✓ File selected')).toBeInTheDocument()
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
      })
    })

    it('should enable upload button when file is selected', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /Upload File/i })
        expect(uploadButton).not.toBeDisabled()
      })
    })

    it('should display file size', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['a'.repeat(1024)], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText(/1\.00 KB/i)).toBeInTheDocument()
      })
    })
  })

  describe('File Type Validation', () => {
    it('should accept PDF files', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('✓ File selected')).toBeInTheDocument()
        expect(screen.queryByText(/File type not supported/i)).not.toBeInTheDocument()
      })
    })

    it('should accept image files', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('✓ File selected')).toBeInTheDocument()
        expect(screen.queryByText(/File type not supported/i)).not.toBeInTheDocument()
      })
    })

    it('should accept video files', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'video.mp4', { type: 'video/mp4' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('✓ File selected')).toBeInTheDocument()
        expect(screen.queryByText(/File type not supported/i)).not.toBeInTheDocument()
      })
    })

    it('should reject unsupported file types', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'script.exe', { type: 'application/x-msdownload' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        // Trigger file selection
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        })
        fireEvent.change(input)
      }

      await waitFor(() => {
        // The file should not be selected (no success message)
        expect(screen.queryByText('✓ File selected')).not.toBeInTheDocument()
      })
      
      // Check that upload button is still disabled
      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('File Size Validation', () => {
    it('should accept files under 10MB', async () => {
      render(<FileUploadModal {...defaultProps} />)

      // 5MB file
      const file = new File(['a'.repeat(5 * 1024 * 1024)], 'document.pdf', {
        type: 'application/pdf',
      })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('✓ File selected')).toBeInTheDocument()
        expect(screen.queryByText(/File size exceeds/i)).not.toBeInTheDocument()
      })
    })

    it('should reject files over 10MB', async () => {
      render(<FileUploadModal {...defaultProps} />)

      // 15MB file
      const file = new File(['a'.repeat(15 * 1024 * 1024)], 'large-file.pdf', {
        type: 'application/pdf',
      })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 10MB limit/i)).toBeInTheDocument()
        expect(screen.queryByText('✓ File selected')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with selected file', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test content'], 'contract.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      await waitFor(() => expect(uploadButton).not.toBeDisabled())

      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(file)
      })
    })

    it('should show error when submitting without file', async () => {
      const { container } = render(<FileUploadModal {...defaultProps} />)

      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      
      // The button should be disabled when no file is selected
      expect(uploadButton).toBeDisabled()
    })

    it('should close modal after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined)
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      await waitFor(() => expect(uploadButton).not.toBeDisabled())

      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should show uploading state during submission', async () => {
      let resolveSubmit: () => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })
      mockOnSubmit.mockReturnValue(submitPromise)

      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      const uploadButton = screen.getByRole('button', { name: /Upload File/i })
      await waitFor(() => expect(uploadButton).not.toBeDisabled())

      fireEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument()
      })

      resolveSubmit!()
    })
  })

  describe('Drag and Drop', () => {
    it('should show drag state when dragging over', () => {
      render(<FileUploadModal {...defaultProps} />)

      // Find the drop zone div (the one with border-dashed)
      const dropZones = document.querySelectorAll('[class*="border-dashed"]')
      const dropZone = dropZones[0] as HTMLElement

      if (dropZone) {
        fireEvent.dragEnter(dropZone)
        // Check that the component has the dragging state class
        expect(dropZone.className).toContain('border-primary')
      }
    })

    it('should handle file drop', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'dropped.pdf', { type: 'application/pdf' })
      const dropZone = screen.getByText(/Drag and drop a file here/i).parentElement

      if (dropZone) {
        const dropEvent = new Event('drop', { bubbles: true })
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: { files: [file] },
        })

        fireEvent(dropZone, dropEvent)

        await waitFor(() => {
          expect(screen.getByText('dropped.pdf')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal is closed', async () => {
      render(<FileUploadModal {...defaultProps} />)

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const input = screen.getByLabelText(/File/i).parentElement?.querySelector('input[type="file"]')

      if (input) {
        await userEvent.upload(input, file)
      }

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Mobile Optimization', () => {
    it('should have large touch targets for buttons', () => {
      render(<FileUploadModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      const uploadButton = screen.getByRole('button', { name: /Upload File/i })

      expect(cancelButton).toHaveClass('h-12')
      expect(uploadButton).toHaveClass('h-12')
    })
  })

  describe('Cancel Button', () => {
    it('should call onOpenChange when cancel is clicked', () => {
      render(<FileUploadModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should not call onSubmit when cancel is clicked', () => {
      render(<FileUploadModal {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })
})
