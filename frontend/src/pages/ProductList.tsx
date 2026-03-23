import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, X, } from 'lucide-react';
import ProductCard from '../components/ProductCard';

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
    <div className="product-list-page" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', padding: '2rem' }}>
      <aside className="sidebar-filters" style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={20} /> Filters
          </h3>
          {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedSubCategories.length > 0) && (
            <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Clear All
            </button>
          )}
        </div>

        {/* Categories Section */}
        <div className="filter-group" style={{ marginBottom: '2.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 800 }}>Categories</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filters.categories.map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: selectedCategories.includes(cat) ? 800 : 500 }}>
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)} 
                  onChange={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-dark)' }}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Sub-Categories Section */}
        {filters.subCategories.length > 0 && (
          <div className="filter-group" style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 800 }}>Sub-Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
              {filters.subCategories.map(sub => (
                <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: selectedSubCategories.includes(sub) ? 800 : 500 }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSubCategories.includes(sub)} 
                    onChange={() => toggleFilter(sub, selectedSubCategories, setSelectedSubCategories)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-dark)' }}
                  />
                  {sub}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Brands Section */}
        <div className="filter-group">
          <h4 style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 800 }}>Brands</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
            {filters.brands.map(brand => (
              <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: selectedBrands.includes(brand) ? 800 : 500 }}>
                <input 
                  type="checkbox" 
                  checked={selectedBrands.includes(brand)} 
                  onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-dark)' }}
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      </aside>

      <main className="product-results">
        <header className="results-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>Materials Catalog</h2>
          <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.95rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {products.length} Products Available
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '10rem 0' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
            <p style={{ fontWeight: 700, color: '#64748b' }}>Refreshing catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
            <X size={48} color="#94a3b8" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No matches found</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Try adjusting your filters or search criteria.</p>
            <button onClick={clearAllFilters} className="primary-btn" style={{ margin: '0 auto' }}>Reset All Filters</button>
          </div>
        ) : (
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
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
