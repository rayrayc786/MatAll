import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, ShoppingCart, ShieldCheck, Zap, ChevronDown, Minus, Plus, Heart, Share2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <Zap className="animate-spin" size={48} color="var(--primary)" />
      <p style={{ fontWeight: 700, color: '#64748b' }}>Loading technical specs...</p>
    </div>
  );
  
  if (!product) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h2>Material not found.</h2>
      <button className="primary-btn" onClick={() => navigate('/products')} style={{ marginTop: '1rem' }}>Back to Materials</button>
    </div>
  );

  const cartItem = cart.find(
    (item) => item.product._id === product._id && item.selectedVariant === selectedVariant?.name
  );

  const currentPrice = selectedVariant ? selectedVariant.price : (product.salePrice || product.price);
  const currentMrp = selectedVariant ? selectedVariant.mrp : (product.mrp || 0);

  return (
    <main className="content pdp" style={{ padding: '2rem' }}>
      <div className="product-showcase" style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
        <div className="product-image-large" style={{ background: '#f8fafc', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={getFullImageUrl(selectedVariant?.image || product.imageUrl)} 
            alt={product.name} 
            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '20px' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=800';
            }}
          />
        </div>
        
        <div className="product-essentials">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="brand-badge" style={{ background: '#f1f5f9', padding: '6px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              {product.brand || 'Premium Material'}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="icon-btn" style={{ background: '#f8fafc' }}><Share2 size={20} /></button>
              <button className="icon-btn" style={{ background: '#f8fafc' }}><Heart size={20} /></button>
            </div>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0f172a', lineHeight: 1.2 }}>{product.name}</h1>
          <p className="sku" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem', marginBottom: '2rem' }}>
            SKU: <span style={{ color: '#0f172a' }}>{selectedVariant?.sku || product.sku}</span> | CSI: <span style={{ color: '#0f172a' }}>{product.csiMasterFormat || 'N/A'}</span>
          </p>
          
          <div className="variant-section" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#64748b' }}>SELECT SPECIFICATION</label>
            <div className="variant-selector-container" ref={dropdownRef} style={{ maxWidth: '400px' }}>
              {product.variants?.length > 1 ? (
                <>
                  <button 
                    className="variant-dropdown-btn" 
                    onClick={() => setShowVariants(!showVariants)}
                    style={{ padding: '0.8rem 1.25rem', fontSize: '1rem' }}
                  >
                    <span>{selectedVariant?.name} — ₹{selectedVariant?.price}</span> 
                    <ChevronDown size={20} />
                  </button>
                  {showVariants && (
                    <div className="variant-menu" style={{ top: 'calc(100% + 8px)' }}>
                      {product.variants.map((v: any) => (
                        <div 
                          key={v.sku} 
                          className={`variant-option ${selectedVariant?.sku === v.sku ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedVariant(v);
                            setShowVariants(false);
                          }}
                          style={{ padding: '1rem 1.25rem' }}
                        >
                          <span>{v.name}</span>
                          <span className="v-price">₹{v.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                  {selectedVariant?.name || product.unitLabel || 'Standard Unit'}
                </div>
              )}
            </div>
          </div>

          <div className="price-display" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>₹{currentPrice}</span>
              <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>/ {product.unitLabel || 'unit'}</span>
            </div>
            {currentMrp > currentPrice && (
              <div style={{ fontSize: '1.1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600, marginTop: '4px' }}>
                MRP: ₹{currentMrp}
              </div>
            )}
            <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.9rem', marginTop: '8px' }}>
              Inclusive of all taxes
            </div>
          </div>
          
          <div className="action-row" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {cartItem ? (
              <div className="quantity-control active" style={{ height: '54px', minWidth: '160px', padding: '0 1.5rem' }}>
                <button onClick={() => addToCart(product, -1, selectedVariant?.name)} style={{ transform: 'scale(1.3)' }}><Minus size={18} /></button>
                <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, selectedVariant?.name)} style={{ transform: 'scale(1.3)' }}><Plus size={18} /></button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product, 1, selectedVariant?.name)} 
                className="quick-add-btn"
                style={{ height: '54px', padding: '0 3rem', fontSize: '1.1rem', flex: 1, maxWidth: '300px' }}
              >
                <ShoppingCart size={22} /> Add to Cart
              </button>
            )}
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4', padding: '12px 20px', borderRadius: '16px', border: '1px solid #bcf0da' }}>
              <Zap size={24} color="#16a34a" fill="#16a34a" />
              <div>
                <div style={{ fontWeight: 900, color: '#16a34a', fontSize: '0.95rem' }}>FREE DELIVERY</div>
                <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 700 }}>In {product.deliveryTime || '60 mins'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="technical-section" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="specs-card" style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem' }}>
            <FileText size={24} color="var(--primary-dark)" /> Technical Specifications
          </h3>
          <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {product.category && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 0', color: '#64748b', fontWeight: 600 }}>Category</td>
                  <td style={{ padding: '1rem 0', fontWeight: 700, textAlign: 'right' }}>{product.category}</td>
                </tr>
              )}
              {product.subCategory && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 0', color: '#64748b', fontWeight: 600 }}>Sub Category</td>
                  <td style={{ padding: '1rem 0', fontWeight: 700, textAlign: 'right' }}>{product.subCategory}</td>
                </tr>
              )}
              {product.size && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 0', color: '#64748b', fontWeight: 600 }}>Standard Unit</td>
                  <td style={{ padding: '1rem 0', fontWeight: 700, textAlign: 'right' }}>{product.size}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 0', color: '#64748b', fontWeight: 600 }}>Logistics Weight</td>
                <td style={{ padding: '1rem 0', fontWeight: 700, textAlign: 'right' }}>{product.weightPerUnit} kg</td>
              </tr>
              <tr>
                <td style={{ padding: '1rem 0', color: '#64748b', fontWeight: 600 }}>Packaging Volume</td>
                <td style={{ padding: '1rem 0', fontWeight: 700, textAlign: 'right' }}>{product.volumePerUnit} m³</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="compliance-card" style={{ background: '#0f172a', color: 'white', padding: '2.5rem', borderRadius: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem' }}>
            <ShieldCheck size={24} color="var(--primary)" /> Quality & Compliance
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Every batch of this material is lab-tested and certified to meet industrial safety standards.
          </p>
          <ul className="docs-list" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>Safety Data Sheet (MSDS)</span>
              <Download size={18} color="var(--primary)" />
            </li>
            <li style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>Industrial IS Certification</span>
              <Download size={18} color="var(--primary)" />
            </li>
            <li style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontWeight: 600 }}>Batch Test Report</span>
              <Download size={18} color="var(--primary)" />
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
