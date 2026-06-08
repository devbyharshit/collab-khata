import { render, screen } from '@testing-library/react'
import RootLayout from '../layout'

// Mock the components used in the layout
jest.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}))
jest.mock('@/components/navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}))
jest.mock('@/components/top-header', () => ({
  TopHeader: () => <div data-testid="top-header">TopHeader</div>,
}))
jest.mock('@/contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}))
jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

describe('RootLayout', () => {
  it('renders children within the application shell', () => {
    // We have to mock the html/body wrapping to prevent nesting issues in jsdom
    // However, since RootLayout renders html/body, we can just render it.
    render(
      <RootLayout>
        <div data-testid="child-content">Child Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('top-header')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByTestId('toaster')).toBeInTheDocument()
  })
})
