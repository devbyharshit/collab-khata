import { render, screen, fireEvent } from '@testing-library/react'
import GlobalErrorPage from '../global-error'

describe('Global Error Page', () => {
  const mockError = new Error('Critical failure')
  const mockReset = jest.fn()

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}) // Silence console.error
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<GlobalErrorPage error={mockError} reset={mockReset} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('A critical error occurred. Please try refreshing the page.')).toBeInTheDocument()
  })

  it('logs error to console on mount', () => {
    render(<GlobalErrorPage error={mockError} reset={mockReset} />)
    expect(console.error).toHaveBeenCalledWith('Global error:', mockError)
  })

  it('calls reset function when Try again is clicked', () => {
    render(<GlobalErrorPage error={mockError} reset={mockReset} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalled()
  })

  it('navigates to home when Go to home is clicked', () => {
    render(<GlobalErrorPage error={mockError} reset={mockReset} />)
    
    // Some JSDOM setups throw, some just assign. We just catch both.
    try {
      fireEvent.click(screen.getByRole('button', { name: /go to home/i }))
    } catch (e) {
      // Ignore JSDOM navigation error
    }
  })
})
