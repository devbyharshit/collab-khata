import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingButton } from '../ui/loading-button'

describe('LoadingButton', () => {
  it('should render button with children text', () => {
    render(<LoadingButton>Click me</LoadingButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should show loading state with spinner', () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should show custom loading text when provided', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Processing...">
        Click me
      </LoadingButton>
    )
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('should be disabled when loading', () => {
    render(<LoadingButton isLoading={true}>Click me</LoadingButton>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<LoadingButton disabled={true}>Click me</LoadingButton>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should be disabled when both loading and disabled', () => {
    render(
      <LoadingButton isLoading={true} disabled={true}>
        Click me
      </LoadingButton>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should call onClick when not loading', () => {
    const handleClick = jest.fn()
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when loading', () => {
    const handleClick = jest.fn()
    render(
      <LoadingButton isLoading={true} onClick={handleClick}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should apply custom className', () => {
    render(<LoadingButton className="custom-class">Click me</LoadingButton>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should support different button variants', () => {
    const { rerender } = render(
      <LoadingButton variant="outline">Click me</LoadingButton>
    )
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<LoadingButton variant="destructive">Click me</LoadingButton>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should support different button sizes', () => {
    const { rerender } = render(
      <LoadingButton size="sm">Click me</LoadingButton>
    )
    let button = screen.getByRole('button')
    expect(button).toBeInTheDocument()

    rerender(<LoadingButton size="lg">Click me</LoadingButton>)
    button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
