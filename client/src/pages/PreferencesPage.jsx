import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { savePreferences } from '../store/slices/userPreferencesSlice';
import { GET_PREFERENCES_DATA } from '../graphql/queries';
import '../styles/preferences.css';

function PreferencesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedCategories, location, isLoaded } = useAppSelector((state) => state.userPreferences);
  const { loading, error, data } = useQuery(GET_PREFERENCES_DATA);

  const [localCategories, setLocalCategories] = useState([]);
  const [localLocation, setLocalLocation] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (isLoaded) {
      setLocalCategories(selectedCategories);
      setLocalLocation(location);
    }
  }, [selectedCategories, location, isLoaded]);

  const handleCheckboxChange = (categoryId) => {
    setLocalCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLocationChange = (event) => {
    setLocalLocation(event.target.value);
  };

  const handleSaveChanges = async () => {
    try {
      await dispatch(savePreferences({ categories: localCategories, location: localLocation })).unwrap();
      setSavedMessage('Preferences saved successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setSavedMessage('Error saving preferences. Please try again.');
    }
  };

  if (loading) return <p className="loading-message">Loading settings...</p>;
  if (error) return <p className="error-message">Error loading settings: {error.message}</p>;

  const availableCategories = data?.categories || [];
  const availableLocations = data?.locations || [];

  return (
    <div className="preferences-view">
      <h1 className="view-title">Customize Your News Feed</h1>
      
      <div className="preferences-section">
        <h2 className="section-title">Select Categories</h2>
        <p className="section-subtitle">Choose the topics you're interested in.</p>
        {availableCategories.length > 0 ? (
          <div className="category-selection-grid">
            {availableCategories.map(category => (
              <div key={category.id} className="category-item">
                <input
                  type="checkbox"
                  id={category.id}
                  name={category.name}
                  value={category.id}
                  checked={localCategories.includes(category.id)}
                  onChange={() => handleCheckboxChange(category.id)}
                />
                <label htmlFor={category.id}>{category.name}</label>
              </div>
            ))}
          </div>
        ) : (
          <p>No categories available.</p>
        )}
      </div>

      <div className="preferences-section">
        <h2 className="section-title">Select Location</h2>
        <p className="section-subtitle">Choose a default country for your news.</p>
        {availableLocations.length > 0 ? (
          <select 
            value={localLocation} 
            onChange={handleLocationChange}
            className="location-select"
          >
            {availableLocations.map(loc => (
              <option key={loc.id} value={loc.code}>
                {loc.name}
              </option>
            ))}
          </select>
        ) : (
          <p>No locations available.</p>
        )}
      </div>

      <button onClick={handleSaveChanges} className="save-button">
        Save Changes
      </button>
      {savedMessage && <p className="saved-message">{savedMessage}</p>}
    </div>
  );
}

export default PreferencesPage;