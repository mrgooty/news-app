import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../store/slices/uiStateSlice';
import { FaSun, FaMoon, FaSearch } from 'react-icons/fa';
import WeatherWidget from './WeatherWidget';
import '../styles/Header.css';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isDarkMode = useSelector((state) => state.uiState.isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-logo">
            <NavLink to="/">
              <img src="/logo.svg" alt="SmartNews Logo" className="logo-svg" />
              SmartNews
            </NavLink>
          </div>
          <WeatherWidget />
        </div>

        <div className="header-center">
          <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
            <ul>
              <li><NavLink to="/">Home</NavLink></li>
              <li><NavLink to="/search">Search</NavLink></li>
              <li><NavLink to="/local">Local News</NavLink></li>
              <li><NavLink to="/preferences">Preferences</NavLink></li>
            </ul>
          </nav>
        </div>

        <div className="header-right">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button" aria-label="Search">
              <FaSearch />
            </button>
          </form>
          <button
            onClick={handleThemeToggle}
            className="theme-toggle-button"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;