import React from 'react';
import { Link } from 'react-router-dom';
import './../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Section 1: Brand and Description */}
        <div className="footer-section">
          <h3 className="footer-title">NewsApp</h3>
          <p className="footer-description">
            Your trusted source for aggregated news, providing clarity and insight from around the globe.
          </p>
        </div>

        {/* Section 2: Key Categories */}
        <div className="footer-section">
          <h3 className="footer-title">Top Categories</h3>
          <ul className="footer-links">
            <li><Link to="/category/technology">Technology</Link></li>
            <li><Link to="/category/business">Business</Link></li>
            <li><Link to="/category/science">Science</Link></li>
            <li><Link to="/category/health">Health</Link></li>
            <li><Link to="/category/world">World</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} NewsApp. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
