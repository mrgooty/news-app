import { Link } from 'react-router-dom';

function CategoryList({ categories }) {
  if (!categories || categories.length === 0) {
    return <div className="no-categories">No categories available.</div>;
  }

  return (
    <div className="category-list">
      {categories.map(category => (
        <div key={category.id} className="category-card">
          <Link to={`/category/${category.id}`}>
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default CategoryList;