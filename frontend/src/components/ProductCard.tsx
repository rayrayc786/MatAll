import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, ChevronDown, Heart, ShoppingCart, Timer, Star } from 'lucide-react';
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

  // Random ratings for UI consistency with reference
  const ratingData = useMemo(() => {
    const rating = (Math.random() * (5 - 3.8) + 3.8).toFixed(1);
    const count = Math.floor(Math.random() * 50000) + 100;
    return { rating, count: count.toLocaleString() };
  }, [product._id]);

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
  
  const discount = currentMrp > currentPrice 
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) 
    : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.blinkit-add-action') || target.closest('.blinkit-variant-selector') || target.closest('.fav-icon-btn')) {
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
    <div className="blinkit-list-card" onClick={handleCardClick}>
      <div className="list-card-image-section">
        <button 
          className={`list-fav-btn ${isFavorite ? 'active' : ''}`} 
          onClick={toggleFavorite}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2} />
        </button>
        
        <img 
          src={getFullImageUrl(selectedVariant?.image || product.imageUrl)} 
          alt={product.name} 
          className="list-product-img"
        />
        
        {/* In-stock indicator (green square dot) */}
        <div className="stock-dot-indicator">
          <div className="dot"></div>
        </div>
      </div>

      <div className="list-card-details">
        <div className="list-variant-row">
          <div className="list-unit-info">
            {selectedVariant?.name || product.unitLabel || 'Standard'}
          </div>
          
          <div className="list-add-container">
            {cartItem ? (
              <div className="list-qty-control" onClick={e => e.stopPropagation()}>
                <button onClick={() => addToCart(product, -1, selectedVariant?.name)}><Minus size={14} /></button>
                <span className="list-qty-val">{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, selectedVariant?.name)}><Plus size={14} /></button>
              </div>
            ) : (
              <div className="list-add-wrapper">
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product, 1, selectedVariant?.name); }} 
                  className="list-add-btn"
                >
                  ADD
                </button>
                {product.variants?.length > 1 && (
                   <span className="options-tag">{product.variants.length} options</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="list-pricing-section">
           {currentMrp > currentPrice && <div className="list-mrp">₹{currentMrp}</div>}
           <div className="list-price-row">
              <span className="list-price">₹{currentPrice}</span>
              {discount > 0 && <span className="list-discount">{discount}% OFF on MRP</span>}
           </div>
        </div>

        <h3 className="list-product-name">{product.name}</h3>
        
        <div className="list-meta-row">
          <div className="list-rating">
            {[1,2,3,4,5].map(i => (
               <Star key={i} size={12} fill={i <= 4 ? "#facc15" : "#e2e8f0"} color={i <= 4 ? "#facc15" : "#e2e8f0"} />
            ))}
            <span className="rating-count">({ratingData.count})</span>
          </div>
          <div className="list-delivery-time">
            <Timer size={12} /> {product.deliveryTime || '10 mins'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
