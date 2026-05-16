import { render, RenderOptions, RenderResult, act } from '@testing-library/react'
import { ReactElement } from 'react'

/**
 * Custom render function that wraps the render in act() to avoid warnings
 * about state updates not being wrapped in act().
 * 
 * This is particularly useful for components with useEffect hooks that
 * trigger state updates on mount.
 */
export function renderWithAct(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  let result: RenderResult

  act(() => {
    result = render(ui, options)
  })

  return result!
}

/**
 * Re-export all testing library utilities for convenience
 */
export * from '@testing-library/react'
export { renderWithAct as render }
