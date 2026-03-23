import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, ShoppingCart, ShieldCheck, Zap, ChevronDown, Minus, Plus, Heart, Share2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './product-detail.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [showVariants, setShowVariants] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVariants(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=800';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  if (loading) return (
    <div className="pdp-loading-container">
      <Zap className="animate-spin" size={48} color="var(--primary)" />
      <p className="pdp-loading-text">Loading technical specs...</p>
    </div>
  );
  
  if (!product) return (
    <div className="pdp-not-found">
      <h2>Material not found.</h2>
      <button className="primary-btn pdp-back-btn" onClick={() => navigate('/products')}>Back to Materials</button>
    </div>
  );

  const cartItem = cart.find(
    (item) => item.product._id === product._id && item.selectedVariant === selectedVariant?.name
  );

  const currentPrice = selectedVariant ? selectedVariant.price : (product.salePrice || product.price);
  const currentMrp = selectedVariant ? selectedVariant.mrp : (product.mrp || 0);

  return (
    <main className="content pdp pdp-main">
      <div className="product-showcase pdp-showcase">
        <div className="product-image-large pdp-image-container">
          <img 
            src={getFullImageUrl(selectedVariant?.image || product.imageUrl)} 
            alt={product.name} 
            className="pdp-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=800';
            }}
          />
        </div>
        
        <div className="product-essentials">
          <div className="pdp-header-actions">
            <div className="brand-badge pdp-brand-badge">
              {product.brand || 'Premium Material'}
            </div>
            <div className="pdp-icon-actions">
              <button className="icon-btn pdp-icon-btn"><Share2 size={20} /></button>
              <button className="icon-btn pdp-icon-btn"><Heart size={20} /></button>
            </div>
          </div>

          <h1 className="pdp-title">{product.name}</h1>
          <p className="sku pdp-sku-line">
            SKU: <span className="pdp-sku-value">{selectedVariant?.sku || product.sku}</span> | CSI: <span className="pdp-sku-value">{product.csiMasterFormat || 'N/A'}</span>
          </p>
          
          <div className="variant-section pdp-price-container">
            <label className="pdp-variant-label">SELECT SPECIFICATION</label>
            <div className="variant-selector-container pdp-variant-selector" ref={dropdownRef}>
              {product.variants?.length > 1 ? (
                <>
                  <button 
                    className="variant-dropdown-btn pdp-variant-dropdown" 
                    onClick={() => setShowVariants(!showVariants)}
                  >
                    <span>{selectedVariant?.name} — ₹{selectedVariant?.price}</span> 
                    <ChevronDown size={20} />
                  </button>
                  {showVariants && (
                    <div className="variant-menu pdp-variant-menu">
                      {product.variants.map((v: any) => (
                        <div 
                          key={v.sku} 
                          className={`variant-option pdp-variant-option ${selectedVariant?.sku === v.sku ? 'active' : ''}`}
                          onClick={() => {
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
                <div className="pdp-single-variant">
                  {selectedVariant?.name || product.unitLabel || 'Standard Unit'}
                </div>
              )}
            </div>
          </div>

          <div className="price-display pdp-price-container">
            <div className="pdp-price-row">
              <span className="pdp-current-price">₹{currentPrice}</span>
              <span className="pdp-unit-label">/ {product.unitLabel || 'unit'}</span>
            </div>
            {currentMrp > currentPrice && (
              <div className="pdp-mrp">
                MRP: ₹{currentMrp}
              </div>
            )}
            <div className="pdp-tax-info">
              Inclusive of all taxes
            </div>
          </div>
          
          <div className="action-row pdp-action-row">
            {cartItem ? (
              <div className="quantity-control active pdp-qty-control">
                <button onClick={() => addToCart(product, -1, selectedVariant?.name)} className="pdp-qty-btn"><Minus size={18} /></button>
                <span className="pdp-qty-value">{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, selectedVariant?.name)} className="pdp-qty-btn"><Plus size={18} /></button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product, 1, selectedVariant?.name)} 
                className="quick-add-btn pdp-add-cart-btn"
              >
                <ShoppingCart size={22} /> Add to Cart
              </button>
            )}
            
            <div className="pdp-delivery-badge">
              <Zap size={24} color="#16a34a" fill="#16a34a" />
              <div>
                <div className="pdp-delivery-title">FREE DELIVERY</div>
                <div className="pdp-delivery-time">In {product.deliveryTime || '60 mins'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="technical-section pdp-tech-section">
        <div className="specs-card pdp-specs-card">
          <h3 className="pdp-section-title">
            <FileText size={24} color="var(--primary-dark)" /> Technical Specifications
          </h3>
          <table className="specs-table pdp-specs-table">
            <tbody>
              {product.category && (
                <tr className="pdp-spec-row">
                  <td className="pdp-spec-label">Category</td>
                  <td className="pdp-spec-value">{product.category}</td>
                </tr>
              )}
              {product.subCategory && (
                <tr className="pdp-spec-row">
                  <td className="pdp-spec-label">Sub Category</td>
                  <td className="pdp-spec-value">{product.subCategory}</td>
                </tr>
              )}
              {product.size && (
                <tr className="pdp-spec-row">
                  <td className="pdp-spec-label">Standard Unit</td>
                  <td className="pdp-spec-value">{product.size}</td>
                </tr>
              )}
              <tr className="pdp-spec-row">
                <td className="pdp-spec-label">Logistics Weight</td>
                <td className="pdp-spec-value">{product.weightPerUnit} kg</td>
              </tr>
              <tr>
                <td className="pdp-spec-label">Packaging Volume</td>
                <td className="pdp-spec-value">{product.volumePerUnit} m³</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="compliance-card pdp-compliance-card">
          <h3 className="pdp-section-title">
            <ShieldCheck size={24} color="var(--primary)" /> Quality & Compliance
          </h3>
          <p className="pdp-compliance-text">
            Every batch of this material is lab-tested and certified to meet industrial safety standards.
          </p>
          <ul className="docs-list pdp-docs-list">
            <li className="pdp-doc-item">
              <span className="pdp-doc-label">Safety Data Sheet (MSDS)</span>
              <Download size={18} color="var(--primary)" />
            </li>
            <li className="pdp-doc-item">
              <span className="pdp-doc-label">Industrial IS Certification</span>
              <Download size={18} color="var(--primary)" />
            </li>
            <li className="pdp-doc-item">
              <span className="pdp-doc-label">Batch Test Report</span>
              <Download size={18} color="var(--primary)" />
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
