import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, ChevronDown, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isFavorite, setIsFavorite] = useState(user.favorites?.includes(product._id));
  
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.length > 0 ? product.variants[0] : null
  );
  const [showVariants, setShowVariants] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariants(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartItem = cart.find(
    (item) => item.product._id === product._id && item.selectedVariant === selectedVariant?.name
  );

  const currentPrice = selectedVariant ? selectedVariant.price : (product.salePrice || product.price);
  const currentMrp = selectedVariant ? selectedVariant.mrp : (product.mrp || 0);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.quick-add-btn') || target.closest('.quantity-control') || target.closest('.variant-selector-container') || target.closest('.fav-btn-overlay')) {
      return;
    }
    navigate(`/products/${product._id}`);
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to favorite products');
      return;
    }

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/favorites/toggle`, { productId: product._id }, {
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
    <div className={`product-card-modern ${showVariants ? 'dropdown-open' : ''}`} onClick={handleCardClick}>
      <div className="material-img-wrap">
        <img 
          src={getFullImageUrl(selectedVariant?.image || product.imageUrl)} 
          alt={product.name} 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
          }}
        />
        <div className="delivery-badge-mini">{product.deliveryTime || '60 MINS'}</div>
        <button 
          className={`fav-btn-overlay ${isFavorite ? 'active' : ''}`} 
          onClick={toggleFavorite}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.5} />
        </button>
      </div>
      
      <div className="product-info-modern">
        <div className="brand-label">{product.brand}</div>
        <h3 className="product-name-title">
          {product.name}
        </h3>
        
        <div className="variant-selector-container" ref={dropdownRef}>
          {product.variants?.length > 1 ? (
            <>
              <button 
                className="variant-dropdown-btn" 
                onClick={(e) => { e.stopPropagation(); setShowVariants(!showVariants); }}
              >
                <span>{selectedVariant?.name} — ₹{selectedVariant?.price}</span> 
                <ChevronDown size={16} />
              </button>
              {showVariants && (
                <div className="variant-menu">
                  {product.variants.map((v: any) => (
                    <div 
                      key={v.sku} 
                      className={`variant-option ${selectedVariant?.sku === v.sku ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariant(v);
                        setShowVariants(false);
                      }}
                    >
                      <span>{v.name}</span>
                      <span className="v-price">₹{v.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="single-variant-label">
              {selectedVariant?.name || product.unitLabel || 'Standard'}
            </div>
          )}
        </div>

        <div className="card-footer-modern">
          <div className="price-stack">
            {currentMrp > currentPrice && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                ₹{currentMrp}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span className="price">₹{currentPrice}</span>
              <span className="unit-text">/{product.unitLabel || 'pc'}</span>
            </div>
          </div>
          
          {cartItem ? (
            <div className="quantity-control active" onClick={e => e.stopPropagation()}>
              <button onClick={() => addToCart(product, -1, selectedVariant?.name)}><Minus size={14} /></button>
              <span className="qty-val">{cartItem.quantity}</span>
              <button onClick={() => addToCart(product, 1, selectedVariant?.name)}><Plus size={14} /></button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(product, 1, selectedVariant?.name); }} 
              className="quick-add-btn"
            >
              <ShoppingCart size={16} /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
