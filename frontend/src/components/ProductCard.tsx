import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, Heart, Star, X, Clock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import './product-card.css';

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
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Sync selected variant if product changes (e.g. on navigation or filter change)
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product._id]);
  
  // Random ratings for UI consistency with reference
  const ratingData = useMemo(() => {
    const rating = (Math.random() * (5 - 3.8) + 3.8).toFixed(1);
    const count = Math.floor(Math.random() * 5000) + 100;
    return { rating, count: count.toLocaleString() };
  }, [product._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariantModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentVariantName = selectedVariant?.name || 'Standard';

  const cartItem = cart.find(
    (item) => item.product._id === product._id && item.selectedVariant === currentVariantName
  );

  const currentPrice = Number(selectedVariant ? selectedVariant.price : (product.salePrice || product.price));
  const currentMrp = Number(selectedVariant ? selectedVariant.mrp : (product.mrp || 0));
  
  const discount = (currentMrp > currentPrice && currentMrp > 0)
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) 
    : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.list-add-container') || target.closest('.list-fav-btn') || target.closest('.dropdown-trigger')) {
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, currentVariantName);
  };

  // Clean product name to avoid duplicate brand
  const displayName = useMemo(() => {
    const brand = (product.brand || '').toLowerCase();
    const name = (product.name || '');
    if (name.toLowerCase().startsWith(brand)) {
      return name.slice(brand.length).trim();
    }
    return name;
  }, [product.brand, product.name]);

  return (
    <div className="blinkit-list-card" onClick={handleCardClick}>
      {/* 1. Image Section */}
      <div className="list-card-image-section">
        <button 
          className={`list-fav-btn ${isFavorite ? 'active' : ''}`} 
          onClick={toggleFavorite}
        >
          <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2} />
        </button>
        
        <img 
          src={getFullImageUrl(selectedVariant?.image || product.imageUrl)} 
          alt={product.name} 
          className="list-product-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
          }}
        />
        
        <div className="stock-dot-indicator">
          <div className="dot"></div>
        </div>
      </div>

      <div className="list-card-details">
        {/* 2. Unit & Action Row */}
        <div className="list-action-row">
          <div className="list-unit-info">
            {selectedVariant?.name || product.unitLabel || 'Standard'}
          </div>
          
          <div className="list-add-container">
            {cartItem ? (
              <div className="list-qty-control" onClick={e => e.stopPropagation()}>
                <button onClick={() => addToCart(product, -1, currentVariantName)}><Minus size={12} /></button>
                <span className="list-qty-val">{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, currentVariantName)}><Plus size={12} /></button>
              </div>
            ) : (
              <div className="add-btn-wrapper">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.variants && product.variants.length > 1) {
                      setShowVariantModal(true);
                    } else {
                      handleAddToCart(e);
                    }
                  }} 
                  className="list-add-btn"
                >
                  ADD
                </button>
                {product.variants && product.variants.length > 1 && (
                  <span className="options-text">{product.variants.length} options</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Pricing Section */}
        <div className="list-pricing-section">
           <div className="list-price-row">
              <span className="list-price">₹{currentPrice}</span>
              <span className="list-mrp">{currentMrp > currentPrice ? `₹${currentMrp}` : ''}</span>
           </div>
           {discount > 0 && (
             <div className="list-discount-badge-blinkit">
               {discount}% OFF on MRP
             </div>
           )}
        </div>

        {/* 4. Product Name */}
        <h3 className="list-product-name">
          <span className="brand-bold">{product.brand}</span> {displayName}
        </h3>
        
        {/* 5. Meta/Footer Row */}
        <div className="list-meta-row">
          <div className="list-rating">
            <Star size={10} fill="#facc15" color="#facc15" />
            <span className="rating-val">{ratingData.rating}</span>
            <span className="rating-count">({ratingData.count})</span>
          </div>
          <div className="list-delivery-time">
             <Clock size={10} />
             <span>{product.deliveryTime || '10 mins'}</span>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal (Bottom Sheet style) */}
      {showVariantModal && (
        <div className="variant-modal-overlay" onClick={() => setShowVariantModal(false)}>
          <div className="variant-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header-sticky">
              <div className="modal-title-box">
                <h3>{product.brand} {displayName}</h3>
                <p>Select Variant</p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowVariantModal(false)}><X size={20} /></button>
            </div>
            <div className="variants-list">
              {product.variants.map((v: any, idx: number) => {
                const isSelected = selectedVariant?.name === v.name;
                const vCartItem = cart.find(
                  (item) => item.product._id === product._id && item.selectedVariant === v.name
                );
                const vDisc = v.mrp > v.price ? Math.round(((v.mrp - v.price)/v.mrp)*100) : 0;
                
                return (
                  <div key={idx} className={`variant-list-item ${isSelected ? 'selected' : ''}`}>
                    <div className="v-item-left">
                       {vDisc > 0 && <div className="v-discount-badge">{vDisc}% OFF</div>}
                       <img src={getFullImageUrl(v.image || product.imageUrl)} alt={v.name} />
                    </div>
                    <div className="v-item-mid">
                      <span className="v-name">{v.name}</span>
                      <div className="v-price-row">
                        <span className="v-price">₹{v.price}</span>
                        <span className="v-mrp">₹{v.mrp}</span>
                      </div>
                    </div>
                    <div className="v-item-right">
                      {vCartItem ? (
                        <div className="list-qty-control scale-sm">
                          <button onClick={() => addToCart(product, -1, v.name)}><Minus size={10} /></button>
                          <span className="list-qty-val">{vCartItem.quantity}</span>
                          <button onClick={() => addToCart(product, 1, v.name)}><Plus size={10} /></button>
                        </div>
                      ) : (
                        <button 
                          className="list-add-btn"
                          onClick={() => {
                            setSelectedVariant(v);
                            addToCart(product, 1, v.name);
                          }}
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
