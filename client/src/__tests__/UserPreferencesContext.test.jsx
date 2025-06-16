import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserPreferencesProvider, useUserPreferences } from '../context/UserPreferencesContext.jsx';

function wrapper({ children }) {
  return <UserPreferencesProvider>{children}</UserPreferencesProvider>;
}

describe('UserPreferencesContext', () => {
  it('toggles categories', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });
    act(() => result.current.toggleCategory('a'));
    expect(result.current.selectedCategories).toContain('a');
    act(() => result.current.toggleCategory('a'));
    expect(result.current.selectedCategories).not.toContain('a');
  });

  it('toggles dark mode', () => {
    const { result } = renderHook(() => useUserPreferences(), { wrapper });
    act(() => result.current.toggleDarkMode());
    expect(result.current.darkMode).toBe(true);
  });
});
