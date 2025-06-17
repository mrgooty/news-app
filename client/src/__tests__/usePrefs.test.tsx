import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePrefs } from '../hooks/usePrefs'

describe('usePrefs', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('initially returns null', () => {
    const { result } = renderHook(() => usePrefs())
    expect(result.current.prefs).toBe(null)
  })

  it('saves preferences to sessionStorage', () => {
    const { result } = renderHook(() => usePrefs())
    act(() => {
      result.current.save({ categories: ['a'], locations: ['b'] })
    })
    expect(sessionStorage.getItem('newsAppPrefs')).toBe(
      JSON.stringify({ categories: ['a'], locations: ['b'] })
    )
  })

  it('clears preferences', () => {
    const { result } = renderHook(() => usePrefs())
    act(() => {
      result.current.save({ categories: ['a'], locations: ['b'] })
    })
    act(() => {
      result.current.clear()
    })
    expect(sessionStorage.getItem('newsAppPrefs')).toBe(null)
    expect(result.current.prefs).toBe(null)
  })
})
