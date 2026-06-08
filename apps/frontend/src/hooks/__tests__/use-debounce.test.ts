import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

jest.useFakeTimers()

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated', delay: 500 })

    // Value should not update immediately
    expect(result.current).toBe('initial')

    // Fast-forward time by 250ms (before delay)
    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Value should still be the initial value
    expect(result.current).toBe('initial')

    // Fast-forward time to complete the delay
    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Value should now be updated
    expect(result.current).toBe('updated')
  })

  it('should use default delay of 500ms if not provided', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(499)
    })
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })
})
