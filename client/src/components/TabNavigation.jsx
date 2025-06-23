import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setActiveTab } from '../store/slices/uiStateSlice';
import { prefetchCategory } from '../store/slices/newsDataSlice';
import '../styles/components/TabNavigation.css';

function TabNavigation({ categories = [], selectedCategory }) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const tabsRef = useRef(null);
  const activeTab = useAppSelector((state) => state.uiState.activeTab);
  
  const [prefetching, setPrefetching] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 70px is the height of the header
      if (window.scrollY > 70) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setIsHovered(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      dispatch(setActiveTab('home'));
    } else if (path.startsWith('/category/')) {
      const categoryId = path.split('/').pop();
      dispatch(setActiveTab(categoryId));
    } else {
      dispatch(setActiveTab(null)); // No active tab if not home or a category page
    }
  }, [location, dispatch]);
  
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

  const handleTabClick = (tabId) => {
    dispatch(setActiveTab(tabId));
  };

  const handleMouseEnter = (categoryId) => {
    if (prefetching !== categoryId) {
      setPrefetching(categoryId);
      dispatch(prefetchCategory(categoryId));
    }
  };
  
  const handleMouseLeave = () => {
    setPrefetching(null);
  };

  const showFullTabs = !isCollapsed || isHovered;

  if (isCollapsed && !isHovered) {
    return (
      <div 
        className="tab-nav-collapsed" 
        onMouseEnter={() => setIsHovered(true)}
      >
        <FaBars />
      </div>
    );
  }

  return (
    <div 
      className={`tab-navigation-container ${isCollapsed ? 'floating' : ''}`}
      onMouseLeave={isCollapsed ? () => setIsHovered(false) : undefined}
    >
      <div className="tabs-wrapper">
        <div className="tabs-container" ref={tabsRef}>
          <div 
            className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
          >
            <Link to="/">For You</Link>
          </div>
          
          {categories.map(category => (
            <div 
              key={category.id}
              className={`tab-item ${activeTab === category.id ? 'active' : ''}`}
              onClick={() => handleTabClick(category.id)}
              onMouseEnter={() => handleMouseEnter(category.id)}
              onMouseLeave={handleMouseLeave}
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