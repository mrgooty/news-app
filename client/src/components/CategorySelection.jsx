import React from 'react';

function CategorySelection({ categories, selectedCategories, toggleCategory }) {
  // Helper function to check if a category is selected
  const isSelected = (categoryId) => {
    return selectedCategories.includes(categoryId);
  };

  return (
    <div className="category-selection">
      {categories.map(category => (
        <div 
          key={category.id}
          className={`category-item ${isSelected(category.id) ? 'selected' : ''}`}
          onClick={() => toggleCategory(category.id)}
        >
          <h3>{category.name}</h3>
          {category.description && <p>{category.description}</p>}
          <div className="category-checkbox">
            <input 
              type="checkbox" 
              checked={isSelected(category.id)} 
              onChange={() => {}} // Handled by the onClick on the parent div
              id={`category-${category.id}`}
            />
            <label htmlFor={`category-${category.id}`}>
              {isSelected(category.id) ? 'Selected' : 'Select'}
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CategorySelection;