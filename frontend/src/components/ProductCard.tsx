import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, ChevronDown, Heart, Star } from 'lucide-react';
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
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [showVariants, setShowVariants] = useState(false);

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
        setShowVariants(false);
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
        <div className="list-variant-row">
          <div 
            className={`list-unit-info ${product.variants && product.variants.length > 1 ? 'dropdown-trigger' : 'standard-unit'}`}
            onClick={(e) => {
              if (product.variants && product.variants.length > 1) {
                e.stopPropagation();
                setShowVariants(!showVariants);
              }
            }}
          >
            <span className="unit-text-truncate">{selectedVariant?.name || product.unitLabel || 'Standard'}</span>
            {product.variants && product.variants.length > 1 && (
              <ChevronDown size={10} className={`ml-1 transition-transform ${showVariants ? 'rotate-180' : ''}`} />
            )}
            
            {showVariants && product.variants && product.variants.length > 1 && (
              <div className="variants-dropdown" ref={dropdownRef} onClick={e => e.stopPropagation()}>
                <div className="variants-dropdown-header">Select Option</div>
                {product.variants.map((v: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`variant-option ${selectedVariant?.name === v.name ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedVariant(v);
                      setShowVariants(false);
                    }}
                  >
                    <div className="variant-info">
                      <span className="variant-name">{v.name}</span>
                      <span className="variant-price">₹{v.price}</span>
                    </div>
                    {selectedVariant?.name === v.name && <div className="selected-check">✓</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="list-add-container">
            {cartItem ? (
              <div className="list-qty-control" onClick={e => e.stopPropagation()}>
                <button onClick={() => addToCart(product, -1, currentVariantName)}><Minus size={10} /></button>
                <span className="list-qty-val">{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, currentVariantName)}><Plus size={10} /></button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCart} 
                className="list-add-btn"
              >
                ADD
              </button>
            )}
          </div>
        </div>

        <div className="list-pricing-section">
           <div className="list-price-row">
              <span className="list-price">₹{currentPrice}</span>
              <span className="list-mrp">{currentMrp > currentPrice ? `₹${currentMrp}` : ''}</span>
           </div>
           <div className="list-discount-row">
              {discount > 0 ? (
                <span className="list-discount-tag">{discount}% OFF</span>
              ) : (
                <span className="list-discount-spacer"></span>
              )}
           </div>
        </div>

        <h3 className="list-product-name">
          <span className="brand-bold">{product.brand}</span> {displayName}
        </h3>
        
        <div className="list-meta-row">
          <div className="list-rating">
            <Star size={10} fill="#facc15" color="#facc15" />
            <span className="rating-val">{ratingData.rating}</span>
          </div>
          <div className="list-delivery-time">
             {product.deliveryTime || '10m'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
