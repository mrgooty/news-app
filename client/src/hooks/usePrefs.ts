import { useState, useEffect } from 'react'
import { getPrefs, setPrefs, clearPrefs, Prefs } from '../lib/prefs'

const PREFERENCES_KEY = 'news_app_preferences'

export function usePrefs() {
  const [prefs, setLocalPrefs] = useState<Prefs | null>(null)

  useEffect(() => {
    setLocalPrefs(getPrefs())
  }, [])

  const save = (newPrefs: Prefs) => {
    setPrefs(newPrefs)
    setLocalPrefs(newPrefs)
  }

  const clear = () => {
    clearPrefs()
    setLocalPrefs(null)
  }

  return { prefs, save, clear }
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
