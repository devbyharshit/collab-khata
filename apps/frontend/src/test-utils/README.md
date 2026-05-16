# Test Utilities

This directory contains custom testing utilities to improve the testing experience and eliminate common warnings.

## renderWithAct

A custom render function that automatically wraps the render call in `act()` to prevent React warnings about state updates not being wrapped in act().

### Usage

Instead of importing `render` from `@testing-library/react`, import it from `@/test-utils/render-with-act`:

```typescript
// ❌ Old way - causes act() warnings
import { render, screen } from '@testing-library/react'

test('my test', () => {
  render(<MyComponent />)
  // ...
})

// ✅ New way - no warnings
import { screen } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'

test('my test', () => {
  render(<MyComponent />)
  // ...
})
```

### Why is this needed?

Components with `useEffect` hooks that trigger state updates on mount can cause React to warn about state updates not being wrapped in `act()`. This is especially common with modal components that reset their form state when opened.

The `renderWithAct` utility automatically wraps the render call in `act()`, eliminating these warnings while keeping your test code clean and readable.

### What about other act() calls?

You still need to wrap other state-changing operations in `act()`:

```typescript
import { screen, fireEvent, act } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'

test('button click', async () => {
  render(<MyComponent />)
  
  const button = screen.getByRole('button')
  
  // Still wrap user interactions in act()
  await act(async () => {
    fireEvent.click(button)
  })
  
  // Or use userEvent which handles act() internally
  await userEvent.click(button)
})
```

### All exports

The utility re-exports all testing library functions, so you can import everything you need from one place:

```typescript
import { render, screen, fireEvent, waitFor, act } from '@/test-utils/render-with-act'
```
