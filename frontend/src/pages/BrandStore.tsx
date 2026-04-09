import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ArrowUpDown, 
  Filter
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

import './sub-category.css'; // Reusing established layout styles
import SEO from '../components/SEO';
import { getFullImageUrl } from '../utils/imageUrl';
const BrandStore: React.FC = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();

  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const resultsAreaRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<string>('default');
  const [subCategories, setSubCategories] = useState<any[]>([]);



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?brand=${brandName}`);
        setProducts(data);
        
        // Extract unique subcategories within this brand
        const uniqueSubs = Array.from(new Set(data.map((p: any) => p.subCategory))).filter(Boolean) as string[];
        const subData = uniqueSubs.map(sub => {
          const firstProd = data.find((p: any) => p.subCategory === sub);
          return {
            name: sub,
            image: firstProd?.imageUrl ? getFullImageUrl(firstProd.imageUrl) : 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=200',
          };
        });
        setSubCategories(subData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [brandName]);

  // Scroll results area back to top when sub-category changes
  useEffect(() => {
    if (resultsAreaRef.current) {
      resultsAreaRef.current.scrollTo(0, 0);
    }
  }, [selectedSubCat]);

  const filteredProducts = useMemo(() => {
    let result = selectedSubCat 
      ? products.filter(p => p.subCategory === selectedSubCat)
      : [...products];
      
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, selectedSubCat, sortBy]);

  return (
    <div className="brand-store-page">
      <SEO 
        title={`${brandName} Store`} 
        description={`Shop official ${brandName} products on MatAll. Wide range of building materials and tools available for quick delivery.`} 
      />
      <header className="brand-header-sticky">
        <div className="header-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2>{brandName}</h2>
            <span>Official Brand Store</span>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low')}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
            </button>
            <button className="filter-chip-pill">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
      </header>

      <main className="sub-cat-main-layout main-content-responsive">
        {/* Sidebar: Sub-Categories within this Brand */}
        <aside className="cat-sidebar">
          <div 
            className={`cat-sidebar-item ${selectedSubCat === null ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(null)}
          >
            <div className="cat-sidebar-img">
              <div className="cat-all-icon">All</div>
            </div>
            <span>All {brandName}</span>
          </div>
          {subCategories.map((sub, idx) => (
            <div 
              key={idx} 
              className={`cat-sidebar-item ${selectedSubCat === sub.name ? 'active' : ''}`}
              onClick={() => setSelectedSubCat(sub.name)}
            >
              <div className="cat-sidebar-img">
                <img src={sub.image} alt={sub.name} />
              </div>
              <span>{sub.name}</span>
            </div>
          ))}
        </aside>

        {/* Main Content: Brand Products Grid */}
        <section className="cat-product-results" ref={resultsAreaRef}>
          {loading ? (
            <div className="loading-box">Entering {brandName} Store...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="cat-grid-standard">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">No specialized products found for this brand.</div>
          )}
        </section>
      </main>

      {/* Persistent Cart Bar for Brand Shopping */}
      {/* {cartCount > 0 && (
        <div className="view-cart-bar-sticky">
          <div className="cart-bar-info">
            <span className="item-count">{cartCount} Item{cartCount > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{cartTotal}</span>
          </div>
          <Link to="/cart" className="view-cart-btn">
            View Cart <ShoppingCart size={18} />
          </Link>
        </div>
      )} */}
    </div>
  );
};

export default BrandStore;
