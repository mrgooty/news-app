import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL query to fetch categories for the navigation menu
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data } = useQuery(GET_CATEGORIES);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>NewsAI</h1>
          </Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {data && data.categories && data.categories.map(category => (
              <li key={category.id}>
                <Link to={`/category/${category.id}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news..."
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>
    </header>
  );
}

export default Header;