import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewsCard from '../components/NewsCard.jsx';

const article = {
  title: 'Test News',
  url: 'http://example.com',
  description: 'desc'.repeat(60),
  imageUrl: 'http://image',
  source: 'src',
  publishedAt: '2024-01-01T00:00:00Z'
};

describe('NewsCard', () => {
  it('renders title and link', () => {
    render(<NewsCard article={article} />);
    expect(screen.getByText('Test News')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read full article/i })).toHaveAttribute('href', 'http://example.com');
  });

  it('toggles expansion', () => {
    render(<NewsCard article={article} />);
    const button = screen.getAllByRole('button')[0];
    fireEvent.click(button);
    expect(button.textContent).toMatch(/Show less/);
  });
});
