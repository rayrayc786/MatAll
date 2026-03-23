import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, X, } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ brands: string[], categories: string[], subCategories: string[] }>({
    brands: [],
    categories: [],
    subCategories: []
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

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

  // Parse URL params on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && !selectedCategories.includes(cat)) {
      setSelectedCategories([cat]);
    }
  }, [location.search]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        
        // Add selected filters to request
        selectedBrands.forEach(b => params.append('brand', b));
        selectedCategories.forEach(c => params.append('category', c));
        selectedSubCategories.forEach(s => params.append('subCategory', s));

        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?${params.toString()}`);
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedBrands, selectedCategories, selectedSubCategories, location.search]);

  const toggleFilter = (item: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(item)) {
      setSelected(selected.filter(i => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    navigate('/products');
  };

  return (
    <div className="product-list-page">
      <button 
        className="mobile-filter-toggle" 
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <Filter size={18} /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      <aside className={`sidebar-filters ${showMobileFilters ? 'open' : ''}`}>
        <div className="filters-header">
          <h3 className="filters-title">
            <Filter size={20} /> Filters
          </h3>
          <div className="filters-actions">
            {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedSubCategories.length > 0) && (
              <button onClick={clearAllFilters} className="clear-filters-btn">
                Clear All
              </button>
            )}
            <button className="mobile-close-filters" onClick={() => setShowMobileFilters(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="filter-group">
          <h4 className="filter-group-title">Categories</h4>
          <div className="filter-options-list">
            {filters.categories.map(cat => (
              <label key={cat} className="filter-label" style={{ fontWeight: selectedCategories.includes(cat) ? 800 : 500 }}>
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)} 
                  onChange={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                  className="filter-checkbox"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Sub-Categories Section */}
        {filters.subCategories.length > 0 && (
          <div className="filter-group">
            <h4 className="filter-group-title">Sub-Categories</h4>
            <div className="filter-options-scroll">
              {filters.subCategories.map(sub => (
                <label key={sub} className="filter-label" style={{ fontWeight: selectedSubCategories.includes(sub) ? 800 : 500 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSubCategories.includes(sub)} 
                    onChange={() => toggleFilter(sub, selectedSubCategories, setSelectedSubCategories)}
                    className="filter-checkbox"
                  />
                  {sub}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Brands Section */}
        <div className="filter-group">
          <h4 className="filter-group-title">Brands</h4>
          <div className="filter-options-scroll">
            {filters.brands.map(brand => (
              <label key={brand} className="filter-label" style={{ fontWeight: selectedBrands.includes(brand) ? 800 : 500 }}>
                <input 
                  type="checkbox" 
                  checked={selectedBrands.includes(brand)} 
                  onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                  className="filter-checkbox"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      </aside>

      <main className="product-results">
        <header className="results-header">
          <h2 className="catalog-title">Materials Catalog</h2>
          <div className="results-count">
            {products.length} Products Available
          </div>
        </header>

        {loading ? (
          <div className="loading-container">
            <div className="animate-spin loading-spinner"></div>
            <p className="loading-text">Refreshing catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="no-results-container">
            <X size={48} color="#94a3b8" className="no-results-icon" />
            <h3 className="no-results-title">No matches found</h3>
            <p className="no-results-text">Try adjusting your filters or search criteria.</p>
            <button onClick={clearAllFilters} className="primary-btn reset-filters-btn">Reset All Filters</button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductList;
