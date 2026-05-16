# Testing Guide

## React `act()` Warnings - Fixed! ✅

We've resolved the React `act()` warnings that were appearing in our modal component tests.

### The Problem

Components with `useEffect` hooks that trigger state updates when props change (like modal `open` state) were causing warnings:

```
Warning: An update to ConversationLogModal inside a test was not wrapped in act(...).
```

### The Solution

We created a custom `renderWithAct` utility that automatically wraps render calls in `act()`:

**Location:** `src/test-utils/render-with-act.ts`

### How to Use

Instead of importing `render` from `@testing-library/react`, import it from our test utils:

```typescript
// ❌ Old way
import { render, screen } from '@testing-library/react'

// ✅ New way
import { screen } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'
```

### Example

```typescript
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '@/test-utils/render-with-act'
import userEvent from '@testing-library/user-event'

describe('MyModal', () => {
  it('should render correctly', () => {
    // render is automatically wrapped in act()
    render(<MyModal open={true} />)
    
    expect(screen.getByText('My Modal')).toBeInTheDocument()
  })

  it('should handle user input', async () => {
    render(<MyModal open={true} />)
    
    const input = screen.getByLabelText('Name')
    
    // User interactions should still be wrapped in act()
    await act(async () => {
      await userEvent.type(input, 'John Doe')
    })
    
    expect(input).toHaveValue('John Doe')
  })
})
```

### When to Still Use `act()`

You still need to wrap these operations in `act()`:

1. **User interactions** (clicks, typing, etc.)
   ```typescript
   await act(async () => {
     fireEvent.click(button)
   })
   ```

2. **Prop changes** (rerender)
   ```typescript
   await act(async () => {
     rerender(<MyComponent open={false} />)
   })
   ```

3. **Async operations** that trigger state updates
   ```typescript
   await act(async () => {
     await someAsyncFunction()
   })
   ```

### Status

✅ **ConversationLogModal** - All warnings resolved  
✅ **PaymentCreditModal** - Tests passing (minor warnings from complex useEffect)  
✅ **PaymentExpectationModal** - Using new render utility  
✅ **FileUploadModal** - Using new render utility  

### Running Tests

```bash
# Run all tests
npm test

# Run specific modal tests
npm test -- conversation-log-modal

# Run all modal tests
npm test -- --testNamePattern="Modal"
```

## Best Practices

1. **Always use the custom render** from `@/test-utils/render-with-act` for modal components
2. **Wrap user interactions** in `act()` when using `fireEvent`
3. **Use `userEvent`** when possible - it handles `act()` internally
4. **Wrap rerenders** in `act()` when changing props
5. **Keep useEffect dependencies minimal** to reduce unnecessary re-renders

## Additional Resources

- [React Testing Library - act() documentation](https://testing-library.com/docs/react-testing-library/api/#act)
- [React docs - Testing Recipes](https://reactjs.org/docs/testing-recipes.html)
- Our test utils README: `src/test-utils/README.md`
