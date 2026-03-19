import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, ChevronRight, Plus, Minus, ChevronDown, Star, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }: { product: any }) => {
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();
  
  // Get latest user from local storage to check favorites
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isFavorite, setIsFavorite] = useState(user.favorites?.includes(product._id));
  
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.length > 0 ? product.variants[0].name : null
  );
  const [showVariants, setShowVariants] = useState(false);

  const cartItem = cart.find(
    (item) => item.product._id === product._id && item.selectedVariant === selectedVariant
  );

  const currentPrice = selectedVariant 
    ? product.variants.find((v: any) => v.name === selectedVariant).price 
    : product.price;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.quick-add-btn') || target.closest('.quantity-control') || target.closest('.variant-selector-container') || target.closest('.fav-btn-overlay')) {
      return;
    }
    navigate(`/products/${product._id}`);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to favorite products');
      return;
    }

    try {
      const { data } = await axios.post('http://localhost:3000/api/auth/favorites/toggle', { productId: product._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFavorite(!isFavorite);
      user.favorites = data.favorites;
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="product-card-modern" onClick={handleCardClick}>
      <div className="material-img-wrap">
        <img 
          src={product.imageUrl || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400'} 
          alt={product.name} 
        />
        <div className="delivery-badge-mini">60 MINS</div>
        <button 
          className={`fav-btn-overlay ${isFavorite ? 'active' : ''}`} 
          onClick={toggleFavorite}
          style={{ 
            position: 'absolute', top: '12px', right: '12px', 
            background: isFavorite ? 'white' : 'rgba(255,255,255,0.2)', 
            backdropFilter: 'blur(8px)',
            border: 'none', padding: '8px', 
            borderRadius: '50%', cursor: 'pointer', display: 'flex', 
            boxShadow: isFavorite ? '0 4px 6px rgba(0,0,0,0.1)' : 'none', 
            color: isFavorite ? '#ef4444' : 'white',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.5} />
        </button>
      </div>
      
      <div className="product-info-modern">
        <div className="meta-row">
          <span className="csi-tag">CSI: {product.csiMasterFormat}</span>
          <span className="rating-mini"><Star size={10} fill="#f59e0b" color="#f59e0b" /> 4.8</span>
        </div>
        <h3>{product.name}</h3>
        
        {product.variants?.length > 0 ? (
          <div className="variant-selector-container">
            <button className="variant-dropdown-btn" onClick={(e) => { e.stopPropagation(); setShowVariants(!showVariants); }}>
              {selectedVariant} <ChevronDown size={14} />
            </button>
            {showVariants && (
              <div className="variant-menu">
                {product.variants.map((v: any) => (
                  <div 
                    key={v.name} 
                    className={`variant-option ${selectedVariant === v.name ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariant(v.name);
                      setShowVariants(false);
                    }}
                  >
                    <span>{v.name}</span>
                    <span>₹{v.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="unit-label-modern">{product.unitLabel || 'Standard Unit'}</div>
        )}

        <div className="card-footer-modern">
          <div className="price-stack">
            <span className="price">₹{currentPrice.toFixed(2)}</span>
            <span className="tax-info">Incl. GST</span>
          </div>
          
          {cartItem ? (
            <div className="quantity-control active" onClick={e => e.stopPropagation()}>
              <button onClick={() => addToCart(product, -1, selectedVariant)}><Minus size={14} /></button>
              <span>{cartItem.quantity}</span>
              <button onClick={() => addToCart(product, 1, selectedVariant)}><Plus size={14} /></button>
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); addToCart(product, 1, selectedVariant); }} className="quick-add-btn">
              ADD
            </button>
          )}
        </div>
      </div>
      <div className="detail-hover-indicator">
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/products${search}`);
        setProducts(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, [search]);

  return (
    <div className="product-list-page">
      <aside className="sidebar-filters">
        <h3><Filter size={20} /> Advanced Filters</h3>
        <div className="filter-section">
          <label>Brand</label>
          <select>
            <option>All Brands</option>
            <option>Birla</option>
            <option>UltraTech</option>
            <option>Tata Steel</option>
          </select>
        </div>
        <div className="filter-section">
          <label>Grade / Size</label>
          <div className="checkbox-group">
            <label><input type="checkbox" /> 53 Grade</label>
            <label><input type="checkbox" /> 12mm TMT</label>
            <label><input type="checkbox" /> 20mm Aggregate</label>
          </div>
        </div>
      </aside>

      <main className="product-results">
        <header className="results-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Industrial Materials</h2>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{products.length} Items Found</span>
        </header>

        {loading ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '4rem' }}>Loading materials...</div>
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
