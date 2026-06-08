import React from 'react'
import { render, screen } from '@testing-library/react'
import { Spinner, LoadingOverlay, LoadingPage } from '../ui/spinner'
import { 
  Skeleton, 
  CardSkeleton, 
  TableRowSkeleton, 
  DashboardCardSkeleton, 
  ListItemSkeleton 
} from '../ui/skeleton'

describe('Loading Components', () => {
  describe('Spinner', () => {
    it('should render spinner with default size', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('should render spinner with small size', () => {
      render(<Spinner size="sm" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should render spinner with medium size', () => {
      render(<Spinner size="md" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render spinner with large size', () => {
      render(<Spinner size="lg" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })

    it('should apply custom className', () => {
      render(<Spinner className="custom-class" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
    })
  })

  describe('LoadingOverlay', () => {
    it('should render loading overlay without message', () => {
      render(<LoadingOverlay />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render loading overlay with message', () => {
      render(<LoadingOverlay message="Loading data..." />)
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('LoadingPage', () => {
    it('should render loading page without message', () => {
      render(<LoadingPage />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render loading page with message', () => {
      render(<LoadingPage message="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Skeleton Components', () => {
    it('should render basic Skeleton', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-gray-200')
    })

    it('should render CardSkeleton', () => {
      const { container } = render(<CardSkeleton />)
      expect(container.querySelector('.border')).toBeInTheDocument()
    })

    it('should render TableRowSkeleton', () => {
      const { container } = render(<TableRowSkeleton />)
      expect(container.querySelector('.border-b')).toBeInTheDocument()
    })

    it('should render DashboardCardSkeleton', () => {
      const { container } = render(<DashboardCardSkeleton />)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
      expect(container.querySelector('.shadow')).toBeInTheDocument()
    })

    it('should render ListItemSkeleton', () => {
      const { container } = render(<ListItemSkeleton />)
      expect(container.querySelector('.border')).toBeInTheDocument()
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })
  })
})
