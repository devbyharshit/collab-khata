import { render, screen } from '@testing-library/react'
import NotFound from '../not-found'

describe('NotFound Page', () => {
  it('renders correctly', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByText(/The page you're looking for doesn't exist or has been moved/i)).toBeInTheDocument()
  })

  it('renders links', () => {
    render(<NotFound />)
    const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')

    const collaborationsLink = screen.getByRole('link', { name: /view collaborations/i })
    expect(collaborationsLink).toHaveAttribute('href', '/collaborations')
  })
})
