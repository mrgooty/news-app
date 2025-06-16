import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import CategoryList from '../components/CategoryList';
import NewsGrid from '../components/NewsGrid';

// GraphQL query to fetch categories
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      description
    }
  }
`;

function HomePage() {
  const { loading, error, data } = useQuery(GET_CATEGORIES);
  
  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">Error loading categories: {error.message}</div>;

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Stay Informed with AI-Powered News</h1>
        <p>Get the latest news from multiple sources, organized by AI for a better reading experience.</p>
      </section>
      
      <section className="categories-section">
        <h2>News Categories</h2>
        <CategoryList categories={data.categories} />
      </section>
    </div>
  );
}

export default HomePage;