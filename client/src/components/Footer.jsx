import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>NewsAI</h3>
          <p>AI-powered news aggregation from multiple sources</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/category/technology">Technology</Link></li>
            <li><Link to="/category/business">Business</Link></li>
            <li><Link to="/category/science">Science</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>About</h3>
          <p>
            This application aggregates news from multiple sources and uses AI to categorize and summarize articles.
          </p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} NewsAI. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;