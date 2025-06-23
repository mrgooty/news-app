import { useState, useCallback, useEffect } from 'react'
import { getPrefs, setPrefs, clearPrefs, Prefs } from '../lib/prefs'

const PREFERENCES_KEY = 'news_app_preferences'

export interface Prefs {
  categories: string[];
  location: string;
  readingMode: 'compact' | 'comfortable';
  theme: 'light' | 'dark';
}

export const defaultPrefs: Prefs = {
  categories: ['technology', 'business'],
  location: 'us',
  readingMode: 'comfortable',
  theme: 'light',
};

const STORAGE_KEY = 'newsAppPrefs';

function loadPrefs(): Prefs {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      return { ...defaultPrefs, ...JSON.parse(raw) };
    }
  } catch (e) {
    // ignore
  }
  return { ...defaultPrefs };
}

function savePrefs(prefs: Prefs) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}

export function usePrefs() {
  const [preferences, setPreferences] = useState<Prefs>(() => loadPrefs());

  // Sync to storage on change
  useEffect(() => {
    savePrefs(preferences);
  }, [preferences]);

  // Update multiple fields
  const updatePreferences = useCallback((updates: Partial<Prefs>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences({ ...defaultPrefs });
    savePrefs(defaultPrefs);
  }, []);

  // Add a category
  const addCategory = useCallback((category: string) => {
    setPreferences((prev) => {
      if (!category || prev.categories.includes(category)) return prev;
      const next = { ...prev, categories: [...prev.categories, category] };
      savePrefs(next);
      return next;
    });
  }, []);

  // Remove a category
  const removeCategory = useCallback((category: string) => {
    setPreferences((prev) => {
      if (prev.categories.length <= 1) return prev; // Prevent removing last
      const nextCategories = prev.categories.filter((c) => c !== category);
      if (nextCategories.length === 0) return prev;
      const next = { ...prev, categories: nextCategories };
      savePrefs(next);
      return next;
    });
  }, []);

  // Set location
  const setLocation = useCallback((location: string) => {
    setPreferences((prev) => {
      const next = { ...prev, location };
      savePrefs(next);
      return next;
    });
  }, []);

  // Set reading mode
  const setReadingMode = useCallback((readingMode: 'compact' | 'comfortable') => {
    setPreferences((prev) => {
      const next = { ...prev, readingMode };
      savePrefs(next);
      return next;
    });
  }, []);

  // Set theme
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setPreferences((prev) => {
      const next = { ...prev, theme };
      savePrefs(next);
      return next;
    });
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    addCategory,
    removeCategory,
    setLocation,
    setReadingMode,
    setTheme,
  };
}

export const useUserPreferences = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState('us'); // Default to 'us'
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedCategories(parsed.categories || []);
        setLocation(parsed.location || 'us'); // Default to 'us'
        setDarkMode(parsed.darkMode || false);
      }
    } catch (error) {
      console.error("Failed to load preferences from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const savePreferences = (newCategories, newLocation) => {
    try {
      const prefs = { categories: newCategories, location: newLocation, darkMode };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      setSelectedCategories(newCategories);
      setLocation(newLocation);
    } catch (error) {
      console.error("Failed to save preferences to localStorage", error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Apply class to the root element
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }

    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const prefs = { ...parsed, darkMode: newDarkMode };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error("Failed to save dark mode preference", error);
    }
  };

  return {
    selectedCategories,
    location,
    savePreferences,
    darkMode,
    toggleDarkMode,
    isLoaded,
  };
};
