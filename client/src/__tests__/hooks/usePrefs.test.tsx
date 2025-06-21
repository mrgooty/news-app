import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrefs } from '../../hooks/usePrefs';
import * as prefsLib from '../../lib/prefs';

// Mock the prefs library
vi.mock('../../lib/prefs', () => ({
  loadPrefs: vi.fn(),
  savePrefs: vi.fn(),
  defaultPrefs: {
    categories: ['technology', 'business'],
    location: 'us',
    readingMode: 'comfortable',
    theme: 'light'
  }
}));

describe('usePrefs Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default preferences when no saved prefs exist', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      expect(result.current.preferences).toEqual(prefsLib.defaultPrefs);
      expect(prefsLib.loadPrefs).toHaveBeenCalled();
    });

    it('should load saved preferences from localStorage', () => {
      const savedPrefs = {
        categories: ['sports', 'entertainment'],
        location: 'gb',
        readingMode: 'compact',
        theme: 'dark'
      };
      
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(savedPrefs);
      
      const { result } = renderHook(() => usePrefs());
      
      expect(result.current.preferences).toEqual(savedPrefs);
    });

    it('should merge saved preferences with defaults for missing fields', () => {
      const partialPrefs = {
        categories: ['sports'],
        location: 'gb'
        // missing readingMode and theme
      };
      
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(partialPrefs);
      
      const { result } = renderHook(() => usePrefs());
      
      expect(result.current.preferences).toEqual({
        ...prefsLib.defaultPrefs,
        ...partialPrefs
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences and save to localStorage', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.updatePreferences({
          categories: ['technology', 'science'],
          location: 'ca'
        });
      });
      
      expect(result.current.preferences).toEqual({
        ...prefsLib.defaultPrefs,
        categories: ['technology', 'science'],
        location: 'ca'
      });
      
      expect(prefsLib.savePrefs).toHaveBeenCalledWith({
        ...prefsLib.defaultPrefs,
        categories: ['technology', 'science'],
        location: 'ca'
      });
    });

    it('should update only specified fields', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.updatePreferences({
          readingMode: 'compact'
        });
      });
      
      expect(result.current.preferences).toEqual({
        ...prefsLib.defaultPrefs,
        readingMode: 'compact'
      });
    });

    it('should handle empty update object', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      const initialPrefs = result.current.preferences;
      
      act(() => {
        result.current.updatePreferences({});
      });
      
      expect(result.current.preferences).toEqual(initialPrefs);
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to defaults', () => {
      const savedPrefs = {
        categories: ['sports', 'entertainment'],
        location: 'gb',
        readingMode: 'compact',
        theme: 'dark'
      };
      
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(savedPrefs);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.resetPreferences();
      });
      
      expect(result.current.preferences).toEqual(prefsLib.defaultPrefs);
      expect(prefsLib.savePrefs).toHaveBeenCalledWith(prefsLib.defaultPrefs);
    });
  });

  describe('addCategory', () => {
    it('should add a new category to the list', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.addCategory('science');
      });
      
      expect(result.current.preferences.categories).toContain('science');
      expect(result.current.preferences.categories).toHaveLength(3); // technology, business, science
    });

    it('should not add duplicate categories', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.addCategory('technology');
      });
      
      expect(result.current.preferences.categories).toEqual(['technology', 'business']);
      expect(result.current.preferences.categories).toHaveLength(2);
    });

    it('should handle empty category string', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      const initialCategories = result.current.preferences.categories;
      
      act(() => {
        result.current.addCategory('');
      });
      
      expect(result.current.preferences.categories).toEqual(initialCategories);
    });
  });

  describe('removeCategory', () => {
    it('should remove a category from the list', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.removeCategory('business');
      });
      
      expect(result.current.preferences.categories).not.toContain('business');
      expect(result.current.preferences.categories).toEqual(['technology']);
    });

    it('should handle removing non-existent category', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      const initialCategories = result.current.preferences.categories;
      
      act(() => {
        result.current.removeCategory('non-existent');
      });
      
      expect(result.current.preferences.categories).toEqual(initialCategories);
    });

    it('should prevent removing the last category', () => {
      const singleCategoryPrefs = {
        categories: ['technology'],
        location: 'us',
        readingMode: 'comfortable',
        theme: 'light'
      };
      
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(singleCategoryPrefs);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.removeCategory('technology');
      });
      
      expect(result.current.preferences.categories).toEqual(['technology']);
    });
  });

  describe('setLocation', () => {
    it('should update the location preference', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setLocation('gb');
      });
      
      expect(result.current.preferences.location).toBe('gb');
      expect(prefsLib.savePrefs).toHaveBeenCalledWith({
        ...prefsLib.defaultPrefs,
        location: 'gb'
      });
    });

    it('should handle invalid location', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setLocation('invalid-location');
      });
      
      expect(result.current.preferences.location).toBe('invalid-location');
    });
  });

  describe('setReadingMode', () => {
    it('should update the reading mode preference', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setReadingMode('compact');
      });
      
      expect(result.current.preferences.readingMode).toBe('compact');
    });

    it('should handle invalid reading mode', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setReadingMode('invalid-mode');
      });
      
      expect(result.current.preferences.readingMode).toBe('invalid-mode');
    });
  });

  describe('setTheme', () => {
    it('should update the theme preference', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.preferences.theme).toBe('dark');
    });

    it('should handle invalid theme', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.setTheme('invalid-theme');
      });
      
      expect(result.current.preferences.theme).toBe('invalid-theme');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      vi.mocked(prefsLib.loadPrefs).mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const { result } = renderHook(() => usePrefs());
      
      expect(result.current.preferences).toEqual(prefsLib.defaultPrefs);
    });

    it('should handle save errors gracefully', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      vi.mocked(prefsLib.savePrefs).mockImplementation(() => {
        throw new Error('save error');
      });
      
      const { result } = renderHook(() => usePrefs());
      
      // Should not throw error, just log it
      expect(() => {
        act(() => {
          result.current.updatePreferences({ location: 'gb' });
        });
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result, rerender } = renderHook(() => usePrefs());
      const initialPrefs = result.current.preferences;
      
      rerender();
      
      expect(result.current.preferences).toBe(initialPrefs);
    });

    it('should batch multiple preference updates', () => {
      vi.mocked(prefsLib.loadPrefs).mockReturnValue(null);
      
      const { result } = renderHook(() => usePrefs());
      
      act(() => {
        result.current.updatePreferences({ location: 'gb' });
        result.current.updatePreferences({ readingMode: 'compact' });
        result.current.updatePreferences({ theme: 'dark' });
      });
      
      expect(prefsLib.savePrefs).toHaveBeenCalledTimes(3);
    });
  });
}); 