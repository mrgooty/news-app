import { createSlice } from '@reduxjs/toolkit';

const uiStateSlice = createSlice({
  name: 'uiState',
  initialState: {
    // Add the isDarkMode state
    isDarkMode: false,

    // Modal states
    selectedArticle: null,
    isModalOpen: false,
    
    // Navigation states
    activeTab: 'home',
    sidebarOpen: false,
    
    // Loading states
    isLoading: false,
    loadingMessage: '',
    
    // UI feedback states
    showToast: false,
    toastMessage: '',
    toastType: 'info', // 'info', 'success', 'error', 'warning'
    
    // Scroll states
    scrollPosition: 0,
    isScrolling: false,
    
    // Animation states
    animationsEnabled: true,
    reducedMotion: false,
  },
  reducers: {
    // Add the toggleDarkMode reducer
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },

    // Modal actions
    openArticleModal: (state, action) => {
      state.selectedArticle = action.payload;
      state.isModalOpen = true;
    },
    closeArticleModal: (state) => {
      state.selectedArticle = null;
      state.isModalOpen = false;
    },
    
    // Navigation actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    
    // Loading actions
    setLoading: (state, action) => {
      state.isLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Toast actions
    showToast: (state, action) => {
      state.showToast = true;
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type || 'info';
    },
    hideToast: (state) => {
      state.showToast = false;
      state.toastMessage = '';
    },
    
    // Scroll actions
    setScrollPosition: (state, action) => {
      state.scrollPosition = action.payload;
    },
    setScrolling: (state, action) => {
      state.isScrolling = action.payload;
    },
    
    // Animation actions
    toggleAnimations: (state) => {
      state.animationsEnabled = !state.animationsEnabled;
    },
    setReducedMotion: (state, action) => {
      state.reducedMotion = action.payload;
    },
  },
});

export const {
  // Export the new action
  toggleDarkMode,

  openArticleModal,
  closeArticleModal,
  setActiveTab,
  toggleSidebar,
  closeSidebar,
  setLoading,
  showToast,
  hideToast,
  setScrollPosition,
  setScrolling,
  toggleAnimations,
  setReducedMotion,
} = uiStateSlice.actions;

export default uiStateSlice.reducer; 