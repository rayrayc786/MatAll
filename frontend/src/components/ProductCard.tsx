import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Minus, Heart, Star, X, Clock, ChevronDown } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageUrl';
import OnDemandModal from './OnDemandModal';
import './product-card.css';

interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isFavorite, setIsFavorite] = useState(user.favorites?.includes(product._id));
  
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showOnDemandModal, setShowOnDemandModal] = useState(false);

  // Sync selected variant if product changes (e.g. on navigation or filter change)
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
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

  const currentPrice = Number(selectedVariant?.pricing?.salePrice || selectedVariant?.price || product.salePrice || product.price || 0);
  // const gstRate = Number(selectedVariant?.pricing?.gst || (product.variants?.[0]?.pricing?.gst) || 0);
  // const basePrice = currentPrice / (1 + gstRate / 100);
  // const gstAmount = currentPrice - basePrice;
  const currentMrp = Number(selectedVariant?.pricing?.mrp || selectedVariant?.mrp || product.mrp || 0);
  
  const discount = (currentMrp > currentPrice && currentMrp > 0)
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) 
    : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Enhanced check to prevent navigation when clicking action buttons
    if (
      target.closest('.list-add-container') || 
      target.closest('.list-fav-btn') || 
      target.closest('.dropdown-trigger') ||
      target.closest('.options-indicator-row') ||
      target.tagName.toLowerCase() === 'button'
    ) {
      return;
    }
    navigate(`/products/${product._id}`);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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
    const name = (product.productName || product.name || '');
    if (name.toLowerCase().startsWith(brand)) {
      return name.slice(brand.length).trim();
    }
    return name;
  }, [product.brand, product.productName, product.name]);

  return (
    <div className="matall-list-card" onClick={handleCardClick}>
      {/* 1. Image Section */}
      <div className="list-card-image-section">
        {discount > 0 && (
          <div className="list-discount-badge-matall">
            {discount}% OFF
          </div>
        )}
        
        <button 
          className={`list-fav-btn ${isFavorite ? 'active' : ''}`} 
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} strokeWidth={2.5} />
        </button>
        
        <img 
          src={getFullImageUrl(selectedVariant?.images?.[0] || product.images?.[0] || product.imageUrl)} 
          alt={product.name} 
          className="list-product-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
          }}
        />

        <div className={`list-delivery-time ${product.deliveryTime === 'On Demand' ? 'on-demand' : ''}`}>
           <Clock size={12} strokeWidth={3} />
           <span>{product.deliveryTime || '10 mins'}</span>
        </div>
      </div>

      <div className="list-card-details">
        {/* 2. Action Row (Unit Selector + ADD) */}
        <div className="list-action-row">
          <div 
            className={`list-unit-info ${product.variants?.length > 1 ? 'is-clickable' : ''}`}
            onClick={(e) => {
              if (product.variants?.length > 1) {
                e.stopPropagation();
                e.preventDefault();
                setShowVariantModal(true);
              }
            }}
          >
            <span className="unit-label-text">
              {selectedVariant?.attributes && Object.keys(selectedVariant.attributes).length > 0 
                ? Object.values(selectedVariant.attributes)[0]
                : (selectedVariant?.name && selectedVariant.name !== 'Standard' 
                    ? selectedVariant.name.split(',')[0].trim() 
                    : product.unitLabel || 'Standard')}
            </span>
            {product.variants?.length > 1 && <ChevronDown size={14} className="unit-arrow" />}
          </div>
          
          <div className="list-add-container">
            {product.deliveryTime === 'On Demand' ? (
              <button 
                className="list-request-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowOnDemandModal(true);
                }}
              >
                REQUEST
              </button>
            ) : cartItem ? (
              <div className="list-qty-control" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
                <button onClick={(e) => { e.stopPropagation(); addToCart(product, -1, currentVariantName); }} aria-label="Decrease quantity"><Minus size={14} strokeWidth={3} /></button>
                <span className="list-qty-val">{cartItem.quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); addToCart(product, 1, currentVariantName); }} aria-label="Increase quantity"><Plus size={14} strokeWidth={3} /></button>
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
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
            )}
          </div>
        </div>

        {product.variants && product.variants.length > 1 && (
          <div className="options-indicator-row" onClick={(e) => { e.stopPropagation(); setShowVariantModal(true); }}>
             <span className="options-text">{product.variants.length} options</span>
          </div>
        )}

        {/* 3. Pricing Section */}
        <div className="list-pricing-section">
           <div className="list-price-row">
              <span className="list-price">₹{currentPrice.toFixed(2)}</span>
              {currentMrp > currentPrice && <span className="list-mrp">₹{currentMrp.toFixed(2)}</span>}
           </div>

        </div>

        {/* 4. Product Name */}
        <h3 className="list-product-name">
          <span className="brand-bold">{product.brand}</span> {displayName}
        </h3>
        
        {/* 5. Meta/Footer Row (Rating) */}
        <div className="list-meta-row">
          <div className="list-rating">
            <Star size={12} fill="#facc15" color="#facc15" />
            <span className="rating-val">{(product.avgRating || 0).toFixed(1)}</span>
            <span className="rating-count">({product.numReviews || 0})</span>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal (Bottom Sheet style) */}
      {showVariantModal && createPortal(
        <div className="variant-modal-overlay" onClick={() => setShowVariantModal(false)}>
          <div className="variant-modal-content" ref={dropdownRef} onClick={e => e.stopPropagation()}>
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
                
                // Pricing calculations for variant
                const vsPrice = Number(v.pricing?.salePrice || v.price || 0);
                // const vGstRate = Number(v.pricing?.gst || (product.variants?.[0]?.pricing?.gst) || 0);
                // const vBase = vsPrice / (1 + vGstRate / 100);
                // const vGst = vsPrice - vBase;
                const vmrp = Number(v.pricing?.mrp || v.mrp || 0);
                const vDisc = (vmrp > vsPrice && vmrp > 0) ? Math.round(((vmrp - vsPrice) / vmrp) * 100) : 0;
                
                const vImg = (v.images && v.images.length > 0) ? v.images[0] : (v.image || product.imageUrl);

                return (
                  <div 
                    key={idx} 
                    className={`variant-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <div className="v-item-left">
                       {vDisc > 0 && <div className="v-discount-badge">{vDisc}% OFF</div>}
                       <img src={getFullImageUrl(vImg)} alt={v.name} />
                    </div>
                    
                    <div className="v-item-mid">
                      <span className="v-name">{v.name}</span>
                      <div className="v-price-row">
                        <span className="v-price">₹{vsPrice.toFixed(2)}</span>
                        {vmrp > vsPrice && <span className="v-mrp">₹{vmrp.toFixed(2)}</span>}
                      </div>

                    </div>
                    
                    <div className="v-item-right">
                      {product.deliveryTime === 'On Demand' ? (
                        <button 
                          className="list-request-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVariant(v);
                            setShowVariantModal(false);
                            setShowOnDemandModal(true);
                          }}
                        >
                          REQUEST
                        </button>
                      ) : vCartItem ? (
                        <div className="list-qty-control" onClick={e => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(product, -1, v.name); }} aria-label="Decrease quantity"><Minus size={14} strokeWidth={3} /></button>
                          <span className="list-qty-val">{vCartItem.quantity}</span>
                          <button onClick={(e) => { e.stopPropagation(); addToCart(product, 1, v.name); }} aria-label="Increase quantity"><Plus size={14} strokeWidth={3} /></button>
                        </div>
                      ) : (
                        <button 
                          className="list-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
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
        </div>,
        document.body
      )}

      <OnDemandModal 
        isOpen={showOnDemandModal}
        onClose={() => setShowOnDemandModal(false)}
        product={product}
        variant={selectedVariant}
      />
    </div>
  );
});

export default ProductCard;
