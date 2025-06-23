import { configureStore } from '@reduxjs/toolkit';
import userPreferencesReducer from './slices/userPreferencesSlice';
import newsDataReducer from './slices/newsDataSlice';
import uiStateReducer from './slices/uiStateSlice';
import weatherReducer from './slices/weatherSlice';

export const store = configureStore({
  reducer: {
    userPreferences: userPreferencesReducer,
    newsData: newsDataReducer,
    uiState: uiStateReducer,
    weather: weatherReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
