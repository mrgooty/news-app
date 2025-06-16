import { createContext, useState, useContext, useEffect } from 'react';

// Create context
const UserPreferencesContext = createContext();

// Custom hook for using the context
export const useUserPreferences = () => useContext(UserPreferencesContext);

// Provider component
export function UserPreferencesProvider({ children }) {
  // Initialize state from localStorage if available
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const saved = localStorage.getItem('selectedCategories');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [categoryLocationPairs, setCategoryLocationPairs] = useState(() => {
    const saved = localStorage.getItem('categoryLocationPairs');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
  }, [selectedCategories]);

  useEffect(() => {
    localStorage.setItem('categoryLocationPairs', JSON.stringify(categoryLocationPairs));
  }, [categoryLocationPairs]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Remove category and its location pairing
        const newPairs = { ...categoryLocationPairs };
        delete newPairs[categoryId];
        setCategoryLocationPairs(newPairs);
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Set location for a category
  const setCategoryLocation = (categoryId, locationId) => {
    setCategoryLocationPairs(prev => ({
      ...prev,
      [categoryId]: locationId
    }));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Clear all preferences
  const clearPreferences = () => {
    setSelectedCategories([]);
    setCategoryLocationPairs({});
  };

  const value = {
    selectedCategories,
    categoryLocationPairs,
    darkMode,
    toggleCategory,
    setCategoryLocation,
    toggleDarkMode,
    clearPreferences
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}