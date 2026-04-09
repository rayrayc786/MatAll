import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Filter,
  ArrowUpDown,
  X
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

import SEO from '../components/SEO';
import { getFullImageUrl } from '../utils/imageUrl';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<string>('default'); // 'price-low', 'price-high'
  const [showFilters, setShowFilters] = useState(false);
  
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [modalSubCats, setModalSubCats] = useState<any[]>([]);
  const [activeModalCat, setActiveModalCat] = useState<string | null>(null);
  const [allBrands, setAllBrands] = useState<any[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const subCategoryName = params.get('subCategory');
  const categoryId = params.get('category');
  const initialBrand = params.get('brand');
  const searchTerm = params.get('search');




  useEffect(() => {
    const fetchAllCats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories`);
        setAllCategories(data);
        if (categoryId) setActiveModalCat(categoryId);
      } catch (err) { console.error(err); }
    };
    fetchAllCats();
  }, [categoryId]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands`);
        setAllBrands(data);
      } catch (err) { console.error('Failed to fetch brands:', err); }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (initialBrand) {
      setSelectedBrand(initialBrand);
    }
  }, [initialBrand]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const searchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products${location.search}`;
        const { data } = await axios.get(searchUrl);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.search]);

  // Scroll results area back to top when brand changes
  useEffect(() => {
    if (resultsAreaRef.current) {
      resultsAreaRef.current.scrollTo(0, 0);
    }
  }, [selectedBrand]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!categoryId) {
        setSimilarProducts([]);
        return;
      }
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories?categoryId=${categoryId}`);
        const list = data.map((sc: any) => ({
          name: sc.name,
          link: `/products?category=${categoryId}&subCategory=${sc.name}`
        }));
        setSimilarProducts(list);
      } catch (err) {
        console.error('Failed to fetch similar subcategories:', err);
      }
    };
    fetchSubCategories();
  }, [categoryId]);

  useEffect(() => {
    const fetchModalSubCats = async () => {
      if (!activeModalCat) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories?categoryId=${activeModalCat}`);
        setModalSubCats(data);
      } catch (err) { console.error(err); }
    };
    if (showFilters) fetchModalSubCats();
  }, [activeModalCat, showFilters]);

  const brands = useMemo(() => {
    const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
    return uniqueBrands;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, selectedBrand, sortBy]);

  const currentCategoryMetadata = useMemo(() => {
    if (!categoryId) return null;
    return allCategories.find(c => c.name === categoryId || c._id === categoryId);
  }, [allCategories, categoryId]);

  return (
    <div className="blinkit-list-page">
      <SEO 
        title={subCategoryName || categoryId || 'Products'}
        description={`Explore our collection of ${subCategoryName || categoryId || 'products'} on MatAll. Quality supplies delivered fast.`}
      />
      <header className="list-header-sticky">
        <div className="header-nav main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2 className="buy-online-text">
              {searchTerm ? `Results for "${searchTerm}"` : `Buy ${subCategoryName || 'Products'} online`}
            </h2>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        {subCategoryName && similarProducts.length > 0 && (
          <div className="quick-links-carousel">
            <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
              <span className="ql-label">Similar Products</span>
              <div className="ql-track">
                {similarProducts.map((item, idx) => (
                  <Link 
                    key={idx} 
                    to={item.link} 
                    className={`ql-item ${item.name === subCategoryName ? 'active' : ''}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low')}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
            </button>
            <button className="filter-chip-pill" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
      </header>

      <main className="list-layout-main main-content-responsive">
        {/* Column A: Brands Vertical Scroll */}
        <aside className="brand-sidebar-vertical">
          <div 
            className={`brand-sidebar-item ${selectedBrand === null ? 'active' : ''}`}
            onClick={() => setSelectedBrand(null)}
          >
            <div className="brand-sidebar-img">
              <div className="all-brands-icon">All</div>
            </div>
            <span>All Brands</span>
          </div>
          {brands.map((brand: any, idx) => (
            <div 
              key={idx} 
              className={`brand-sidebar-item ${selectedBrand === brand ? 'active' : ''}`}
              onClick={() => setSelectedBrand(brand)}
            >
              <div className="brand-sidebar-img">
                <img 
                  src={(allBrands.find(b => b.name === brand)?.logoUrl) 
                    ? getFullImageUrl(allBrands.find(b => b.name === brand)?.logoUrl) 
                    : (products.find(p => p.brand === brand)?.imageUrl ? getFullImageUrl(products.find(p => p.brand === brand)?.imageUrl) : `https://ui-avatars.com/api/?name=${encodeURIComponent(brand)}&background=f1f5f9&color=000&bold=true`)} 
                  alt={brand} 
                />
              </div>
              <span>{brand}</span>
            </div>
          ))}
        </aside>

        {/* Product Grid Area */}
        <section className="list-results-area" ref={resultsAreaRef}>
          {loading ? (
            <div className="loading-box">Finding best deals...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="list-grid-3xN">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">No products found for this selection.</div>
          )}

          {/* Blog Space */}
          {currentCategoryMetadata?.description && (
            <div className="category-blog-space">
               {currentCategoryMetadata.description.split('\n').filter((p: string) => p.trim() !== '').map((para: string, idx: number) => (
                 <p key={idx}>{para}</p>
               ))}
            </div>
          )}
        </section>
      </main>


      {/* Categories & Subcategories Filter Modal */}
      {showFilters && (
        <div className="category-filter-modal-overlay">
           <div className="category-filter-modal-container">
              <header className="modal-header">
                 <span>Shop by Category</span>
                 <button className="close-btn" onClick={() => setShowFilters(false)}><X size={24} /></button>
              </header>
              <div className="modal-body-layout">
                 <aside className="cat-sidebar">
                    {allCategories.map(cat => (
                       <div 
                         key={cat._id} 
                         className={`cat-tab ${activeModalCat === cat.name || activeModalCat === cat._id ? 'active' : ''}`}
                         onClick={() => setActiveModalCat(cat.name)}
                       >
                          {cat.name}
                       </div>
                    ))}
                 </aside>
                 <section className="subcat-grid-area">
                    <h3>{activeModalCat}</h3>
                    <div className="subcat-grid">
                       {modalSubCats.length > 0 ? modalSubCats.map(sc => (
                         <div 
                           key={sc._id} 
                           className="subcat-card"
                           onClick={() => {
                              navigate(`/products?category=${encodeURIComponent(activeModalCat || '')}&subCategory=${encodeURIComponent(sc.name)}`);
                              setShowFilters(false);
                           }}
                         >
                            <div className="subcat-img">
                               <img 
                                 src={(products.find(p => p.subCategory === sc.name)?.imageUrl) 
                                   ? getFullImageUrl(products.find(p => p.subCategory === sc.name)?.imageUrl) 
                                   : `https://ui-avatars.com/api/?name=${encodeURIComponent(sc.name)}&background=f1f5f9&color=000&bold=true`} 
                                 alt={sc.name} 
                               />
                            </div>
                            <span>{sc.name}</span>
                         </div>
                       )) : <p>No subcategories found.</p>}
                    </div>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
