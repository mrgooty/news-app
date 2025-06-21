import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const PREFERENCES_KEY = 'news_app_preferences';

// Async thunk for loading preferences
export const loadPreferences = createAsyncThunk(
  'userPreferences/loadPreferences',
  async () => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          selectedCategories: parsed.categories || [],
          location: parsed.location || 'us',
          darkMode: parsed.darkMode || false,
        };
      }
      return {
        selectedCategories: [],
        location: 'us',
        darkMode: false,
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {
        selectedCategories: [],
        location: 'us',
        darkMode: false,
      };
    }
  }
);

// Async thunk for saving preferences
export const savePreferences = createAsyncThunk(
  'userPreferences/savePreferences',
  async ({ categories, location }, { getState }) => {
    try {
      const { darkMode } = getState().userPreferences;
      const prefs = { categories, location, darkMode };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      return { categories, location };
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }
);

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState: {
    selectedCategories: [],
    location: 'us',
    darkMode: false,
    isLoaded: false,
    loading: false,
    error: null,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      // Apply class to the root element
      if (state.darkMode) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
      // Save to localStorage
      try {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        const parsed = saved ? JSON.parse(saved) : {};
        const prefs = { ...parsed, darkMode: state.darkMode };
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      } catch (error) {
        console.error('Failed to save dark mode preference:', error);
      }
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    addCategory: (state, action) => {
      if (!state.selectedCategories.includes(action.payload)) {
        state.selectedCategories.push(action.payload);
      }
    },
    removeCategory: (state, action) => {
      state.selectedCategories = state.selectedCategories.filter(
        cat => cat !== action.payload
      );
    },
    clearCategories: (state) => {
      state.selectedCategories = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoaded = true;
        state.selectedCategories = action.payload.selectedCategories;
        state.location = action.payload.location;
        state.darkMode = action.payload.darkMode;
        // Apply dark mode class
        if (action.payload.darkMode) {
          document.documentElement.classList.add('dark-mode');
        }
      })
      .addCase(loadPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.isLoaded = true;
      })
      .addCase(savePreferences.fulfilled, (state, action) => {
        state.selectedCategories = action.payload.categories;
        state.location = action.payload.location;
      });
  },
});

export const {
  toggleDarkMode,
  setLocation,
  addCategory,
  removeCategory,
  clearCategories,
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer; 