import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CATEGORIES } from '../graphql/queries';
import { useUserPreferences } from '../context/UserPreferencesContext';

function CategorySelection() {
  const { loading, error, data } = useQuery(GET_CATEGORIES);
  const { selectedCategories, toggleCategory } = useUserPreferences();
  const [animatedCategories, setAnimatedCategories] = useState([]);

  // Add animation effect when categories are selected/deselected
  useEffect(() => {
    setAnimatedCategories(selectedCategories);
  }, [selectedCategories]);

  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">Error loading categories: {error.message}</div>;

  return (
    <div className="category-selection">
      <h2>Select News Categories</h2>
      <p className="selection-instruction">Choose the categories you're interested in</p>
      
      <div className="categories-grid">
        {data.categories.map(category => (
          <div 
            key={category.id}
            className={`category-item ${selectedCategories.includes(category.id) ? 'selected' : ''} 
                       ${animatedCategories.includes(category.id) ? 'animate' : ''}`}
            onClick={() => toggleCategory(category.id)}
          >
            <div className="category-icon">
              {/* Icon would be based on category name */}
              <span>{category.name.charAt(0).toUpperCase()}</span>
            </div>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
            <div className="selection-indicator">
              {selectedCategories.includes(category.id) ? '✓' : '+'}
            </div>
          </div>
        ))}
      </div>
      
      {selectedCategories.length > 0 && (
        <div className="selected-summary">
          <p>{selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected</p>
        </div>
      )}
    </div>
  );
}

export default CategorySelection;