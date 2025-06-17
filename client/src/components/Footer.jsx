import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">NewsAI</h3>
          <p className="footer-description">
            AI-powered news aggregation platform that brings you personalized news from multiple sources.
          </p>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Navigation</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/preferences">Preferences</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} NewsAI. All rights reserved.</p>
        <p>
          <a href="https://github.com/mrgooty/news-app" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
