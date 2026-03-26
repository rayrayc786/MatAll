import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ChevronDown, 
  ShoppingCart,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import './product-list.css';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickLinks] = useState<string[]>(['Modular Hardware', 'Windows & Doors', 'Tools', 'Combos']);
  
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const subCategoryName = params.get('subCategory');
  const { cart, totalAmount } = useCart();

  const cartTotal = totalAmount;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products${location.search}`);
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.search]);

  return (
    <div className="blinkit-list-page">
      <header className="list-header-sticky">
        <div className="header-nav main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2>{subCategoryName || 'Products'}</h2>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        <div className="quick-links-carousel">
          <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
            <span className="ql-label">Quick Links</span>
            <div className="ql-track">
              {quickLinks.map((link, idx) => (
                <div key={idx} className="ql-item">{link}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="horizontal-filters-bar main-content-responsive">
          <button className="filter-chip-pill">Brand <ChevronDown size={12} /></button>
          <button className="filter-chip-pill">Price <ChevronDown size={12} /></button>
          <button className="filter-chip-pill">Sort <ChevronDown size={12} /></button>
          <button className="filter-chip-pill">Timeline <ChevronDown size={12} /></button>
        </div>
      </header>

      <main className="list-results-content main-content-responsive">
        {loading ? (
          <div className="loading-box">Finding best deals...</div>
        ) : (
          <div className="list-grid-3xN">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="view-cart-bar-sticky" onClick={() => navigate('/cart')}>
          <div className="cart-bar-info">
            <span className="item-count">{cartCount} Item{cartCount > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{cartTotal}</span>
          </div>
          <div className="view-cart-btn">
            View Cart <ShoppingCart size={18} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
