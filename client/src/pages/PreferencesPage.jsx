import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySelection from '../components/CategorySelection';
import LocationSelection from '../components/LocationSelection';
import { useUserPreferences } from '../context/UserPreferencesContext';

function PreferencesPage() {
  const [activeStep, setActiveStep] = useState('categories'); // 'categories' or 'locations'
  const { selectedCategories, categoryLocationPairs, clearPreferences } = useUserPreferences();
  const navigate = useNavigate();

  // Check if all selected categories have locations paired
  const allCategoriesHaveLocations = selectedCategories.every(
    categoryId => categoryLocationPairs[categoryId]
  );

  // Handle save and navigate to home
  const handleSavePreferences = () => {
    navigate('/');
  };

  return (
    <div className="preferences-page">
      <div className="preferences-header">
        <h1>Customize Your News Feed</h1>
        <p>Select categories and locations to personalize your news experience</p>
      </div>

      <div className="steps-indicator">
        <div 
          className={`step ${activeStep === 'categories' ? 'active' : ''} ${selectedCategories.length > 0 ? 'completed' : ''}`}
          onClick={() => setActiveStep('categories')}
        >
          <span className="step-number">1</span>
          <span className="step-name">Select Categories</span>
        </div>
        <div className="step-connector"></div>
        <div 
          className={`step ${activeStep === 'locations' ? 'active' : ''} ${allCategoriesHaveLocations && selectedCategories.length > 0 ? 'completed' : ''}`}
          onClick={() => selectedCategories.length > 0 && setActiveStep('locations')}
        >
          <span className="step-number">2</span>
          <span className="step-name">Pair Locations</span>
        </div>
      </div>

      <div className="preferences-content">
        {activeStep === 'categories' ? (
          <CategorySelection />
        ) : (
          <LocationSelection />
        )}
      </div>

      <div className="preferences-actions">
        {activeStep === 'categories' ? (
          <>
            <button 
              className="secondary-button" 
              onClick={clearPreferences}
              disabled={selectedCategories.length === 0}
            >
              Clear All
            </button>
            <button 
              className="primary-button" 
              onClick={() => setActiveStep('locations')}
              disabled={selectedCategories.length === 0}
            >
              Next: Pair Locations
            </button>
          </>
        ) : (
          <>
            <button 
              className="secondary-button" 
              onClick={() => setActiveStep('categories')}
            >
              Back to Categories
            </button>
            <button 
              className="primary-button" 
              onClick={handleSavePreferences}
              disabled={!allCategoriesHaveLocations || selectedCategories.length === 0}
            >
              Save Preferences
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PreferencesPage;