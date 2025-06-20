import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserPreferences } from '../hooks/usePrefs';
import '../styles/main.css';

function TabNavigation({ categories = [] }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');
  const tabsRef = useRef(null);
  const { selectedCategories, isLoaded } = useUserPreferences();
  
  // Use selected categories if loaded and available, otherwise show no category tabs
  const displayCategories = isLoaded && selectedCategories.length > 0
    ? categories.filter(cat => selectedCategories.includes(cat.id))
    : [];
  
  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setActiveTab('home');
    } else if (path.startsWith('/category/')) {
      const categoryId = path.split('/').pop();
      setActiveTab(categoryId);
    } else {
      setActiveTab(''); // No active tab if not home or a category page
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