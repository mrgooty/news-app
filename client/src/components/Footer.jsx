import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import './../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd handle the form submission here.
    alert('Thank you for subscribing!');
    e.target.reset();
  };

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Section 1: Brand and Description */}
        <div className="footer-section">
          <h3 className="footer-title">NewsApp</h3>
          <p className="footer-description">
            Your trusted source for aggregated news, providing clarity and insight from around the globe.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
            <a href="#" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="https://github.com/mrgooty/news-app" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faGithub} /></a>
          </div>
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

        {/* Section 3: Company & Legal */}
        <div className="footer-section">
          <h3 className="footer-title">Company</h3>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Section 4: Newsletter Signup */}
        <div className="footer-section">
          <h3 className="footer-title">Stay Informed</h3>
          <p className="footer-description">
            Subscribe to our newsletter for the latest news and updates.
          </p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input 
              type="email" 
              className="newsletter-input" 
              placeholder="your.email@example.com" 
              required 
              aria-label="Email for newsletter"
            />
            <button type="submit" className="newsletter-button">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} NewsApp. All rights reserved.</p>
        <p>
          <Link to="/sitemap">Sitemap</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
