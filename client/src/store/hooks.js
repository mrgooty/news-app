import { useDispatch, useSelector } from 'react-redux';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;

// Custom hooks for specific slices
export const useUserPreferences = () => {
  return useAppSelector((state) => state.userPreferences);
};

export const useNewsData = () => {
  return useAppSelector((state) => state.newsData);
};

export const useUIState = () => {
  return useAppSelector((state) => state.uiState);
};

// Specific selectors for better performance
export const useSelectedCategories = () => {
  return useAppSelector((state) => state.userPreferences.selectedCategories);
};

export const useLocation = () => {
  return useAppSelector((state) => state.userPreferences.location);
};

export const useDarkMode = () => {
  return useAppSelector((state) => state.userPreferences.darkMode);
};

export const useArticles = () => {
  return useAppSelector((state) => state.newsData.articles);
};

export const useLoading = () => {
  return useAppSelector((state) => state.newsData.loading);
};

export const useError = () => {
  return useAppSelector((state) => state.newsData.error);
};

export const useActiveTab = () => {
  return useAppSelector((state) => state.uiState.activeTab);
};

export const useModalState = () => {
  return useAppSelector((state) => ({
    selectedArticle: state.uiState.selectedArticle,
    isModalOpen: state.uiState.isModalOpen,
  }));
}; 