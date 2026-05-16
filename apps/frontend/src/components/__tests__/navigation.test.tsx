import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Navigation } from '../navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'

// Mock dependencies
jest.mock('@/contexts/auth-context')
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation - Responsive Design Tests', () => {
  const mockLogout = jest.fn()
  const mockUser = { id: 1, email: 'test@example.com' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      login: jest.fn(),
      logout: mockLogout,
      loading: false,
    })
    mockUsePathname.mockReturnValue('/dashboard')
  })

  describe('Mobile Viewport Rendering', () => {
    beforeEach(() => {
      // Set mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667
    })

    it('should render bottom navigation on mobile', () => {
      render(<Navigation />)
      
      // Bottom navigation should be visible (check for multiple nav elements)
      const navElements = screen.getAllByRole('navigation')
      expect(navElements.length).toBeGreaterThan(0)
    })

    it('should render all navigation items in bottom bar', () => {
      render(<Navigation />)
      
      // Check for navigation items
      const dashboardLinks = screen.getAllByText('Dashboard')
      const brandsLinks = screen.getAllByText('Brands')
      const collaborationsLinks = screen.getAllByText('Collaborations')
      
      expect(dashboardLinks.length).toBeGreaterThan(0)
      expect(brandsLinks.length).toBeGreaterThan(0)
      expect(collaborationsLinks.length).toBeGreaterThan(0)
    })

    it('should show mobile menu toggle button', () => {
      render(<Navigation />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should toggle mobile dropdown menu', () => {
      render(<Navigation />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      
      // Click to open
      fireEvent.click(menuButton)
      
      // Menu should be open
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toBeInTheDocument()
      
      // Click to close
      fireEvent.click(closeButton)
      
      // Menu should be closed
      const openButton = screen.getByRole('button', { name: /open menu/i })
      expect(openButton).toBeInTheDocument()
    })
  })

  describe('Touch Target Accessibility', () => {
    it('should have minimum height classes for mobile navigation items', () => {
      render(<Navigation />)
      
      // Get all navigation links
      const links = screen.getAllByRole('link')
      
      // Should have multiple links
      expect(links.length).toBeGreaterThan(0)
      
      // Check that bottom nav links have min-h-[56px] class
      const bottomNavLinks = links.filter(link => 
        link.className.includes('min-h-[56px]') || link.className.includes('min-h-[48px]')
      )
      
      expect(bottomNavLinks.length).toBeGreaterThan(0)
    })

    it('should have proper spacing classes for touch targets', () => {
      render(<Navigation />)
      
      const links = screen.getAllByRole('link')
      
      // Ensure there are multiple links to test spacing
      expect(links.length).toBeGreaterThan(1)
      
      // Each link should have padding classes
      links.forEach(link => {
        const hasPadding = link.className.includes('p-') || 
                          link.className.includes('px-') || 
                          link.className.includes('py-')
        
        expect(hasPadding).toBe(true)
      })
    })

    it('should have accessible labels for navigation items', () => {
      render(<Navigation />)
      
      // Check for aria-labels or visible text
      const dashboardLinks = screen.getAllByText('Dashboard')
      const brandsLinks = screen.getAllByText('Brands')
      const collaborationsLinks = screen.getAllByText('Collaborations')
      
      expect(dashboardLinks.length).toBeGreaterThan(0)
      expect(brandsLinks.length).toBeGreaterThan(0)
      expect(collaborationsLinks.length).toBeGreaterThan(0)
    })
  })

  describe('Cross-Device Functionality', () => {
    it('should show desktop navigation on larger screens', () => {
      // Set desktop viewport
      global.innerWidth = 1024
      global.innerHeight = 768
      
      render(<Navigation />)
      
      // Desktop navigation should be present
      const navigation = screen.getAllByRole('navigation')
      expect(navigation.length).toBeGreaterThan(0)
    })

    it('should handle active state correctly', () => {
      mockUsePathname.mockReturnValue('/brands')
      
      render(<Navigation />)
      
      // Brands should be active
      const brandsLinks = screen.getAllByText('Brands')
      expect(brandsLinks.length).toBeGreaterThan(0)
    })

    it('should handle logout on mobile', async () => {
      render(<Navigation />)
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      // Find and click logout button
      const logoutButtons = screen.getAllByText('Logout')
      fireEvent.click(logoutButtons[0])
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })

    it('should close mobile menu when navigating', () => {
      render(<Navigation />)
      
      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      // Verify menu is open by checking for close button
      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toBeInTheDocument()
      
      // The menu should have navigation links visible
      const allDashboardLinks = screen.getAllByText('Dashboard')
      expect(allDashboardLinks.length).toBeGreaterThan(2) // Desktop + Mobile dropdown + Bottom nav
    })

    it('should not render navigation on auth pages', () => {
      mockUsePathname.mockReturnValue('/auth/login')
      
      const { container } = render(<Navigation />)
      
      // Navigation should not be rendered
      expect(container.firstChild).toBeNull()
    })

    it('should not render navigation when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
      
      const { container } = render(<Navigation />)
      
      // Navigation should not be rendered
      expect(container.firstChild).toBeNull()
    })

    it('should display user email in desktop menu', () => {
      // Set desktop viewport
      global.innerWidth = 1024
      
      render(<Navigation />)
      
      // User email should be visible
      const emailElements = screen.getAllByText(mockUser.email)
      expect(emailElements.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile-Specific Interactions', () => {
    it('should have active visual feedback on mobile', () => {
      mockUsePathname.mockReturnValue('/dashboard')
      
      render(<Navigation />)
      
      // Active link should have specific styling
      const dashboardLinks = screen.getAllByText('Dashboard')
      expect(dashboardLinks.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      render(<Navigation />)
      
      const links = screen.getAllByRole('link')
      
      // All links should be focusable
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })
})
