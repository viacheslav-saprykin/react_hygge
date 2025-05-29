import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3010';

const ProductImage = ({ src, alt, className }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className={`${className} image-placeholder`}>
        <span>No Image</span>
      </div>
    );
  }

  return (
    <img src={src} alt={alt} className={className} onError={handleImageError} />
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [tagFilter, setTagFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      // Filter only published products
      const publishedProducts = data.filter((product) => product.published);
      setProducts(publishedProducts);
      setFilteredProducts(publishedProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Tag filter
    if (tagFilter) {
      filtered = filtered.filter((product) =>
        product.tags.some((tag) =>
          tag.toLowerCase().includes(tagFilter.toLowerCase())
        )
      );
    }

    // Price filter - комбінована версія
    // Price filter - розумна версія
    if (priceFilter) {
      const filterValue = priceFilter.trim();
      const numericFilter = parseFloat(filterValue);

      filtered = filtered.filter((product) => {
        // Спочатку перевіряємо точну числову відповідність з більшою толерантністю
        if (!isNaN(numericFilter)) {
          // Якщо різниця менше 0.1 (10 центів) - вважаємо збігом
          if (Math.abs(product.price - numericFilter) < 0.1) {
            return true;
          }

          // Також перевіряємо округлення до найближчого цілого
          if (Math.round(product.price) === numericFilter) {
            return true;
          }
        }

        // Потім перевіряємо, чи починається ціна з введеного значення
        const priceString = product.price.toString();
        return priceString.startsWith(filterValue);
      });
    }

    // Subscription filter
    if (subscriptionFilter) {
      const isSubscription = subscriptionFilter.toLowerCase() === 'yes';
      filtered = filtered.filter(
        (product) => product.subscription === isSubscription
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, tagFilter, priceFilter, subscriptionFilter]);

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const clearFilters = () => {
    setTagFilter('');
    setPriceFilter('');
    setSubscriptionFilter('');
    setCurrentPage(1);
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>PetLab Products</h1>
        <p>Find the perfect products for your pets</p>
      </header>

      <div className="main-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <h2>Filters</h2>

          <div className="filter-group">
            <label htmlFor="tag-filter">Search by Tag:</label>
            <input
              id="tag-filter"
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="e.g., Dog, Cat, Chews..."
            />
          </div>

          <div className="filter-group">
            <label htmlFor="price-filter">Filter by Price:</label>
            <input
              id="price-filter"
              type="text"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              placeholder="e.g., 30, 42..."
            />
          </div>

          <div className="filter-group">
            <label htmlFor="subscription-filter">Subscription Available:</label>
            <select
              id="subscription-filter"
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All Filters
          </button>

          <div className="filter-summary">
            <p>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        </aside>

        {/* Products Table */}
        <main className="products-content">
          {currentProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <>
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Tags</th>
                      <th>Price</th>
                      <th>Subscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <ProductImage
                            src={product.image_src}
                            alt={product.title}
                            className="product-image"
                          />
                        </td>
                        <td>
                          <div className="product-info">
                            <h4>{product.title}</h4>
                            <p className="vendor">{product.vendor}</p>
                            <p className="sku">SKU: {product.sku}</p>
                          </div>
                        </td>
                        <td>
                          <div className="tags">
                            {product.tags.map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="price">
                          ${product.price.toFixed(2)}
                          {product.subscription &&
                            product.subscription_discount && (
                              <div className="subscription-discount">
                                -{product.subscription_discount}% with
                                subscription
                              </div>
                            )}
                        </td>
                        <td>
                          <span
                            className={`subscription-badge ${
                              product.subscription
                                ? 'available'
                                : 'not-available'
                            }`}
                          >
                            {product.subscription
                              ? 'Available'
                              : 'Not Available'}
                          </span>
                        </td>
                        <td>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-product-btn"
                          >
                            View Product
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`page-number ${
                            currentPage === page ? 'active' : ''
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
