import { configureStore } from '@reduxjs/toolkit';
import userPreferencesReducer from './slices/userPreferencesSlice';
import newsDataReducer from './slices/newsDataSlice';
import uiStateReducer from './slices/uiStateSlice';

export const store = configureStore({
  reducer: {
    userPreferences: userPreferencesReducer,
    newsData: newsDataReducer,
    uiState: uiStateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}); 