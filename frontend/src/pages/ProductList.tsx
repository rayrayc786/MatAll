import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Filter,
  ArrowUpDown,
  X,
  MessageCircle
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 8;

  
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
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/brands`);
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
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', page.toString());
        searchParams.set('limit', limit.toString());
        
        const searchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/products?${searchParams.toString()}`;
        const { data } = await axios.get(searchUrl);
        
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);
        setTotalPages(data.totalPages || 1);
        setTotalProducts(data.totalProducts || 0);

        // If it's a search query and results are empty, report to backend
        if (searchTerm && fetchedProducts.length === 0) {
          const userStr = localStorage.getItem('user');
          let userData = {
            searchTerm,
            userName: 'Unknown User',
            userId: null,
            userPhone: '',
            userEmail: ''
          };

          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              userData = {
                searchTerm,
                userName: user.fullName || user.name || 'Unknown User',
                userId: user._id || user.id || null,
                userPhone: user.phoneNumber || user.phone || '',
                userEmail: user.email || ''
              };
            } catch (e) {
              console.error('Failed to parse user for reporting:', e);
            }
          }

          axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/user-requests/report-missing-product`, userData)
            .catch(err => console.error('Failed to report missing product:', err));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.search, searchTerm, page]);


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
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/sub-categories?categoryId=${categoryId}`);
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

  // Ensure an active category is selected when the modal opens
  useEffect(() => {
    if (showFilters && !activeModalCat && allCategories.length > 0) {
      setActiveModalCat(allCategories[0].name || allCategories[0]._id);
    }
  }, [showFilters, allCategories, activeModalCat]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFilters]);

  const activeCatObject = useMemo(() => {
    return allCategories.find(c => c.name === activeModalCat || c._id === activeModalCat);
  }, [allCategories, activeModalCat]);

  useEffect(() => {
    const fetchModalSubCats = async () => {
      const targetId = activeCatObject?._id || activeModalCat;
      
      if (!targetId) return;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/sub-categories?categoryId=${encodeURIComponent(targetId)}`);
        setModalSubCats(data);
      } catch (err) { console.error(err); }
    };
    if (showFilters) fetchModalSubCats();
  }, [activeModalCat, showFilters, activeCatObject]);

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

  const handleClearFilters = () => {
    setSelectedBrand(null);
    setSortBy('default');
    navigate('/products');
  };

  const isFiltered = useMemo(() => {
    return !!(categoryId || subCategoryName || searchTerm || selectedBrand);
  }, [categoryId, subCategoryName, searchTerm, selectedBrand]);

  const currentCategoryMetadata = useMemo(() => {
    if (!categoryId) return null;
    return allCategories.find(c => c.name === categoryId || c._id === categoryId);
  }, [allCategories, categoryId]);

  return (
    <div className="matall-list-page">
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
                {similarProducts.map((item, idx) => {
                  const isActive = item.name === subCategoryName;
                  // If active, clicking again removes the subCategory filter
                  const toggleLink = isActive ? `/products?category=${categoryId}` : item.link;
                  
                  return (
                    <Link 
                      key={idx} 
                      to={toggleLink} 
                      className={`ql-item ${isActive ? 'active' : ''}`}
                    >
                      {item.name}
                      {isActive && <X size={12} style={{ marginLeft: '4px' }} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => {
                if (sortBy === 'default') setSortBy('price-low');
                else if (sortBy === 'price-low') setSortBy('price-high');
                else setSortBy('default');
              }}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
              {sortBy !== 'default' && <X size={12} />}
            </button>
            <button className="filter-chip-pill" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filter
            </button>
            {isFiltered && (
              <button className="filter-chip-pill clear-filter-btn" onClick={handleClearFilters}>
                <X size={14} /> Clear
              </button>
            )}
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
          {brands.map((brand: any, idx) => {
            const brandData = allBrands.find(b => b.name.toLowerCase() === brand.toString().toLowerCase());
            const brandLogo = brandData?.logoUrl;
            
            return (
              <div 
                key={idx} 
                className={`brand-sidebar-item ${selectedBrand === brand ? 'active' : ''}`}
                onClick={() => setSelectedBrand(brand)}
              >
                <div className="brand-sidebar-img">
                  {brandLogo && (
                    <img 
                      src={getFullImageUrl(brandLogo)} 
                      alt={brand} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        const fallback = parent?.querySelector('.brand-initials');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  )}
                  <div 
                    className="brand-initials" 
                    style={{ display: brandLogo ? 'none' : 'flex' }}
                  >
                    {brand.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <span>{brand}</span>
              </div>
            );
          })}
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
            <div className="no-products">
              <p>No products found for this selection.</p>
              <button 
                className="whatsapp-contact-btn"
                onClick={() => {
                  const phoneNumber = '919216921698';
                  const message = encodeURIComponent(`Hi, I couldn't find ${selectedBrand || 'what I was looking for'} on MatAll. Can you help?`);
                  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                }}
              >
                <MessageCircle size={20} />
                Contact us on WhatsApp
              </button>
            </div>
          )}

          {/* Pagination UI */}
          {!loading && totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {products.length} of {totalProducts} products
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  disabled={page === 1}
                  onClick={() => {
                    setPage(prev => prev - 1);
                    resultsAreaRef.current?.scrollTo(0, 0);
                  }}
                >
                  Previous
                </button>
                
                <div className="pagination-pages">
                  {(() => {
                    const range = [];
                    const delta = 1; // pages around current
                    
                    for (let i = 1; i <= totalPages; i++) {
                      if (
                        i <= 3 || // First 3
                        i >= totalPages - 2 || // Last 3
                        (i >= page - delta && i <= page + delta) // Around current
                      ) {
                        range.push(i);
                      }
                    }

                    const rangeWithEllipsis: (number | string)[] = [];
                    let l: number | undefined;

                    for (let i of range) {
                      if (l) {
                        if (i - l === 2) {
                          rangeWithEllipsis.push(l + 1);
                        } else if (i - l !== 1) {
                          rangeWithEllipsis.push('...');
                        }
                      }
                      rangeWithEllipsis.push(i);
                      l = i;
                    }

                    return rangeWithEllipsis.map((p, idx) => (
                      p === '...' ? (
                        <span key={`ell-${idx}`} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={p}
                          className={`page-number ${page === p ? 'active' : ''}`}
                          onClick={() => {
                            setPage(p as number);
                            resultsAreaRef.current?.scrollTo(0, 0);
                          }}
                        >
                          {p}
                        </button>
                      )
                    ));
                  })()}
                </div>

                <button 
                  className="pagination-btn" 
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage(prev => prev + 1);
                    resultsAreaRef.current?.scrollTo(0, 0);
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}


          {/* Blog Space */}
          {currentCategoryMetadata?.description && (
            <div 
              className="category-blog-space rich-text-content"
              dangerouslySetInnerHTML={{ __html: currentCategoryMetadata.description }}
            />
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
