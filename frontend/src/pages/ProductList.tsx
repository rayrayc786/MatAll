import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Filter, X, ArrowLeft, ChevronDown, Search, Mic } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ brands: string[], categories: string[], subCategories: string[] }>({
    brands: [],
    categories: [],
    subCategories: []
  });
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('search') || '';
  
  const selectedCategories = params.getAll('category');
  const selectedBrands = params.getAll('brand');

  // Load initial filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/filters`);
        setFilters(data);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products when URL changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products${location.search}`);
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.search]);

  const handleToggleFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(location.search);
    const existingValues = newParams.getAll(key);
    
    if (existingValues.includes(value)) {
      // Remove this value
      const updatedValues = existingValues.filter(v => v !== value);
      newParams.delete(key);
      updatedValues.forEach(v => newParams.append(key, v));
    } else {
      // Add this value
      newParams.append(key, value);
    }
    
    navigate(`/products?${newParams.toString()}`, { replace: true });
  };

  const handleClearSearch = () => {
    navigate('/products');
  };

  return (
    <div className="blinkit-list-page">
      {/* Search Header Bar */}
      <header className="blinkit-search-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="search-input-wrapper">
          <input 
            type="text" 
            value={searchQuery} 
            onChange={(e) => {
               const val = e.target.value;
               const p = new URLSearchParams(location.search);
               if (val) p.set('search', val); else p.delete('search');
               navigate(`/products?${p.toString()}`, { replace: true });
            }}
            placeholder="Search for products..."
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={handleClearSearch}>
              <X size={20} />
            </button>
          )}
          <button className="mic-btn">
            <Mic size={20} />
          </button>
        </div>
      </header>

      {/* Filter Chips Bar */}
      <div className="filter-chips-bar">
        <button className="filter-chip main-filter">
          <Filter size={16} /> Filters <ChevronDown size={14} />
        </button>
        <button className="filter-chip">
          Sort <ChevronDown size={14} />
        </button>
        <div className="chip-divider"></div>
        {filters.categories.slice(0, 8).map(cat => (
          <button 
            key={cat} 
            className={`filter-chip ${selectedCategories.includes(cat) ? 'active' : ''}`}
            onClick={() => handleToggleFilter('category', cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="blinkit-list-results">
        {loading ? (
          <div className="blinkit-loader">
            <div className="spinner"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="blinkit-no-results">
            <p>No products found {searchQuery && `for "${searchQuery}"`}</p>
            <button onClick={handleClearSearch} className="clear-btn">Clear All</button>
          </div>
        ) : (
          <>
            <div className="blinkit-grid">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Horizontal Promotion Section - Mockup for "Top picks" */}
            <section className="top-picks-section">
              <div className="section-title">Top picks for you</div>
              <div className="picks-scroll">
                {products.slice(0, 8).map(item => (
                  <div key={item._id} className="pick-item" onClick={() => navigate(`/products/${item._id}`)}>
                    <img src={item.imageUrl} alt="" />
                    <span>{item.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ProductList;
