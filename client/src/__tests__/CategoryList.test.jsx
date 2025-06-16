import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CategoryList from '../components/CategoryList.jsx';
import { BrowserRouter } from 'react-router-dom';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('CategoryList', () => {
  it('shows no categories message', () => {
    renderWithRouter(<CategoryList categories={[]} />);
    expect(screen.getByText(/No categories/)).toBeInTheDocument();
  });

  it('renders category cards', () => {
    const categories = [{id:'1', name:'Tech', description:'Desc'}];
    renderWithRouter(<CategoryList categories={categories} />);
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });
});
