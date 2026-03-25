import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Share2, 
  ShoppingCart
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import './brand-store.css';

const BrandStore: React.FC = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, totalAmount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const params = new URLSearchParams(location.search);
  const activeSub = params.get('subCategory');

  const cartTotal = totalAmount;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?brand=${brandName}`);
        setProducts(data);
        
        const uniqueSubs = Array.from(new Set(data.map((p: any) => p.subCategory))).filter(Boolean) as string[];
        setSubCategories(uniqueSubs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [brandName]);

  const filteredProducts = activeSub 
    ? products.filter(p => p.subCategory === activeSub)
    : products;

  return (
    <div className="brand-store-page">
      <header className="brand-header-sticky">
        <div className="header-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2>{brandName}</h2>
          </div>
          <div className="header-actions-right">
             <Share2 size={24} />
             <Link to="/" className="home-btn-link"><Home size={24} /></Link>
          </div>
        </div>

        <div className="brand-quick-links">
          <div className="ql-track">
            <button 
              className={`ql-item ${!activeSub ? 'active' : ''}`}
              onClick={() => navigate(`/brand/${brandName}`)}
            > All </button>
            {subCategories.map((sub, idx) => (
              <button 
                key={idx} 
                className={`ql-item ${activeSub === sub ? 'active' : ''}`}
                onClick={() => navigate(`/brand/${brandName}?subCategory=${sub}`)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="brand-content">
        <div className="brand-hero-banner">
           <img src="https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=1200" alt={brandName} />
           <div className="hero-label">{brandName} Official Store</div>
        </div>

        {loading ? (
          <div className="loading-box">Loading brand collection...</div>
        ) : (
          <div className="brand-product-grid">
            {filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <div className="view-cart-bar-sticky">
          <div className="cart-bar-info">
            <span className="item-count">{cartCount} Item{cartCount > 1 ? 's' : ''}</span>
            <span className="cart-total">₹{cartTotal}</span>
          </div>
          <Link to="/cart" className="view-cart-btn">
            View Cart <ShoppingCart size={18} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default BrandStore;
