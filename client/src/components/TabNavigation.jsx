import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../context/UserPreferencesContext';

function TabNavigation({ categories }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const tabsRef = useRef(null);
  const { selectedCategories } = useUserPreferences();
  
  // Default categories if none are provided or selected
  const defaultCategories = [
    { id: 'general', name: 'News' },
    { id: 'business', name: 'Business' },
    { id: 'technology', name: 'Tech' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'sports', name: 'Sports' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' }
  ];
  
  // Use selected categories if available, otherwise use defaults
  const displayCategories = selectedCategories.length > 0 
    ? categories?.filter(cat => selectedCategories.includes(cat.id)) || []
    : defaultCategories;
  
  // Set active tab based on current route
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveTab('home');
    } else if (location.pathname.startsWith('/category/')) {
      const categoryId = location.pathname.split('/').pop();
      setActiveTab(categoryId);
    }
  }, [location]);
  
  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector(`.tab-item.active`);
      if (activeTabElement) {
        const tabsContainer = tabsRef.current;
        const tabRect = activeTabElement.getBoundingClientRect();
        const containerRect = tabsContainer.getBoundingClientRect();
        
        // Calculate scroll position to center the active tab
        const scrollLeft = activeTabElement.offsetLeft - (containerRect.width / 2) + (tabRect.width / 2);
        tabsContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  return (
    <div className="tab-navigation-container">
      <div className="tabs-wrapper">
        <div className="tabs-container" ref={tabsRef}>
          <div 
            className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Link to="/">For You</Link>
          </div>
          
          {displayCategories.map(category => (
            <div 
              key={category.id}
              className={`tab-item ${activeTab === category.id ? 'active' : ''}`}
              onClick={() => setActiveTab(category.id)}
            >
              <Link to={`/category/${category.id}`}>{category.name}</Link>
            </div>
          ))}
          
          <div className="tab-item tab-item-add">
            <Link to="/preferences" aria-label="Customize categories">
              <span className="tab-add-icon">+</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabNavigation;