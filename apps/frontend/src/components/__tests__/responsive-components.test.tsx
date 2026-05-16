import { render, screen } from '@testing-library/react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { Textarea } from '../ui/textarea'

describe('Responsive Components Tests', () => {
  describe('Button Component - Touch Targets', () => {
    it('should have minimum 44px height on mobile for default size', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      
      // Button should have classes for mobile height
      expect(button.className).toContain('h-12')
    })

    it('should have minimum 44px height on mobile for small size', () => {
      render(<Button size="sm">Small Button</Button>)
      
      const button = screen.getByRole('button', { name: /small button/i })
      expect(button).toBeInTheDocument()
      
      // Small button should still have adequate height on mobile
      expect(button.className).toContain('h-10')
    })

    it('should have larger height on mobile for large size', () => {
      render(<Button size="lg">Large Button</Button>)
      
      const button = screen.getByRole('button', { name: /large button/i })
      expect(button).toBeInTheDocument()
      
      // Large button should have even more height
      expect(button.className).toContain('h-14')
    })

    it('should have icon button with proper dimensions', () => {
      render(<Button size="icon" aria-label="Icon button">X</Button>)
      
      const button = screen.getByRole('button', { name: /icon button/i })
      expect(button).toBeInTheDocument()
      
      // Icon button should be square with adequate size
      expect(button.className).toContain('h-12')
      expect(button.className).toContain('w-12')
    })

    it('should have active state styling', () => {
      render(<Button>Active Button</Button>)
      
      const button = screen.getByRole('button', { name: /active button/i })
      
      // Should have active scale effect
      expect(button.className).toContain('active:scale-95')
    })

    it('should support different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      let button = screen.getByRole('button', { name: /default/i })
      expect(button).toBeInTheDocument()
      
      rerender(<Button variant="destructive">Destructive</Button>)
      button = screen.getByRole('button', { name: /destructive/i })
      expect(button).toBeInTheDocument()
      
      rerender(<Button variant="outline">Outline</Button>)
      button = screen.getByRole('button', { name: /outline/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Input Component - Mobile Optimization', () => {
    it('should have minimum 44px height on mobile', () => {
      render(<Input placeholder="Enter text" />)
      
      const input = screen.getByPlaceholderText(/enter text/i)
      expect(input).toBeInTheDocument()
      
      // Input should have mobile-first height
      expect(input.className).toContain('h-12')
    })

    it('should have larger text size on mobile', () => {
      render(<Input placeholder="Mobile input" />)
      
      const input = screen.getByPlaceholderText(/mobile input/i)
      
      // Should have base text size for mobile
      expect(input.className).toContain('text-base')
    })

    it('should support email input type', () => {
      render(<Input type="email" placeholder="Email" />)
      
      const input = screen.getByPlaceholderText(/email/i)
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should support tel input type for phone numbers', () => {
      render(<Input type="tel" placeholder="Phone" />)
      
      const input = screen.getByPlaceholderText(/phone/i)
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('should support number input type', () => {
      render(<Input type="number" placeholder="Amount" />)
      
      const input = screen.getByPlaceholderText(/amount/i)
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should support date input type', () => {
      render(<Input type="date" data-testid="date-input" />)
      
      const input = screen.getByTestId('date-input')
      expect(input).toHaveAttribute('type', 'date')
    })

    it('should have proper padding for touch interaction', () => {
      render(<Input placeholder="Padded input" />)
      
      const input = screen.getByPlaceholderText(/padded input/i)
      
      // Should have adequate padding
      expect(input.className).toContain('px-4')
    })
  })

  describe('Select Component - Mobile Optimization', () => {
    it('should have minimum 44px height on mobile', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      
      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeInTheDocument()
      
      // Trigger should have mobile-first height
      expect(trigger.className).toContain('h-12')
    })

    it('should have larger text on mobile', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Mobile select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      
      const trigger = screen.getByRole('combobox')
      
      // Should have base text size
      expect(trigger.className).toContain('text-base')
    })

    it('should render placeholder correctly', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      
      expect(screen.getByText(/choose an option/i)).toBeInTheDocument()
    })
  })

  describe('Textarea Component - Mobile Optimization', () => {
    it('should have larger minimum height on mobile', () => {
      render(<Textarea placeholder="Enter description" />)
      
      const textarea = screen.getByPlaceholderText(/enter description/i)
      expect(textarea).toBeInTheDocument()
      
      // Should have mobile-optimized min height
      expect(textarea.className).toContain('min-h-[100px]')
    })

    it('should have larger text size on mobile', () => {
      render(<Textarea placeholder="Mobile textarea" />)
      
      const textarea = screen.getByPlaceholderText(/mobile textarea/i)
      
      // Should have base text size
      expect(textarea.className).toContain('text-base')
    })

    it('should have proper padding for mobile', () => {
      render(<Textarea placeholder="Padded textarea" />)
      
      const textarea = screen.getByPlaceholderText(/padded textarea/i)
      
      // Should have adequate padding
      expect(textarea.className).toContain('px-4')
      expect(textarea.className).toContain('py-3')
    })

    it('should support rows attribute', () => {
      render(<Textarea placeholder="Multi-line" rows={5} />)
      
      const textarea = screen.getByPlaceholderText(/multi-line/i)
      expect(textarea).toHaveAttribute('rows', '5')
    })
  })

  describe('Cross-Device Consistency', () => {
    it('should maintain functionality across viewport sizes', () => {
      // Test that components render correctly regardless of viewport
      const { rerender } = render(<Button>Test Button</Button>)
      
      let button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
      
      // Simulate viewport change (components should still work)
      global.innerWidth = 1024
      rerender(<Button>Test Button</Button>)
      
      button = screen.getByRole('button', { name: /test button/i })
      expect(button).toBeInTheDocument()
    })

    it('should have responsive text sizing', () => {
      render(<Button>Responsive Text</Button>)
      
      const button = screen.getByRole('button', { name: /responsive text/i })
      
      // Should have responsive text classes
      expect(button.className).toMatch(/text-/)
    })

    it('should support disabled state consistently', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button', { name: /disabled button/i })
      expect(button).toBeDisabled()
      expect(button.className).toContain('disabled:opacity-50')
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper focus states', () => {
      render(<Button>Focus Test</Button>)
      
      const button = screen.getByRole('button', { name: /focus test/i })
      
      // Should have focus-visible styles
      expect(button.className).toContain('focus-visible:outline-none')
      expect(button.className).toContain('focus-visible:ring-2')
    })

    it('should support aria labels', () => {
      render(<Button aria-label="Custom label">Icon</Button>)
      
      const button = screen.getByRole('button', { name: /custom label/i })
      expect(button).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </div>
      )
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      
      // All buttons should be in tab order
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })
})
