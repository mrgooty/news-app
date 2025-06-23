import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const WEATHER_KEY = 'news_app_weather';

// Async thunk for loading weather preferences
export const loadWeatherPreferences = createAsyncThunk(
  'weather/loadWeatherPreferences',
  async () => {
    try {
      const saved = localStorage.getItem(WEATHER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          userLocation: parsed.userLocation || null,
          lastWeatherData: parsed.lastWeatherData || null,
          lastUpdated: parsed.lastUpdated || null,
        };
      }
      return {
        userLocation: null,
        lastWeatherData: null,
        lastUpdated: null,
      };
    } catch (error) {
      console.error('Failed to load weather preferences:', error);
      return {
        userLocation: null,
        lastWeatherData: null,
        lastUpdated: null,
      };
    }
  }
);

// Async thunk for saving weather preferences
export const saveWeatherPreferences = createAsyncThunk(
  'weather/saveWeatherPreferences',
  async ({ userLocation, weatherData }, { getState }) => {
    try {
      const { lastUpdated } = getState().weather;
      const prefs = {
        userLocation,
        lastWeatherData: weatherData,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(WEATHER_KEY, JSON.stringify(prefs));
      return prefs;
    } catch (error) {
      console.error('Failed to save weather preferences:', error);
      throw error;
    }
  }
);

const weatherSlice = createSlice({
  name: 'weather',
  initialState: {
    userLocation: null,
    weatherData: null,
    lastWeatherData: null,
    lastUpdated: null,
    loading: false,
    error: null,
    retryCount: 0,
    isLoaded: false,
  },
  reducers: {
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;
      state.error = null;
    },
    clearUserLocation: (state) => {
      state.userLocation = null;
      state.weatherData = null;
      state.error = null;
    },
    clearWeatherData: (state) => {
      state.weatherData = null;
      state.error = null;
    },
    resetRetryCount: (state) => {
      state.retryCount = 0;
    },
    incrementRetryCount: (state) => {
      state.retryCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadWeatherPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWeatherPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoaded = true;
        state.userLocation = action.payload.userLocation;
        state.lastWeatherData = action.payload.lastWeatherData;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(loadWeatherPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.isLoaded = true;
      })
      .addCase(saveWeatherPreferences.fulfilled, (state, action) => {
        state.userLocation = action.payload.userLocation;
        state.lastWeatherData = action.payload.lastWeatherData;
        state.lastUpdated = action.payload.lastUpdated;
      });
  },
});

export const {
  setUserLocation,
  clearUserLocation,
  clearWeatherData,
  resetRetryCount,
  incrementRetryCount,
} = weatherSlice.actions;

export default weatherSlice.reducer;
