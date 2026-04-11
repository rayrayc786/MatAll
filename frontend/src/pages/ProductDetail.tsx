import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Share2, 
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Star,
  Plus,
  Minus,
  RotateCcw,
  ShieldCheck,
  Info,
  Clock
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLocationContext } from '../contexts/LocationContext';
import ProductCard from '../components/ProductCard';
import './product-detail.css';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageUrl';
import SEO from '../components/SEO';
import OnDemandModal from '../components/OnDemandModal';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { location } = useLocationContext();
  
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showReturnPolicy, setShowReturnPolicy] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showOnDemandModal, setShowOnDemandModal] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync selections with URL query parameters for easy sharing
  useEffect(() => {
    if (Object.keys(selections).length === 0) return;
    
    const params = new URLSearchParams();
    Object.entries(selections).forEach(([k, v]) => params.set(k, v));
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selections]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProduct(data);
        
        // Parse current URL params
        const urlParams = new URLSearchParams(window.location.search);
        const urlSelections: Record<string, string> = {};
        urlParams.forEach((value, key) => {
           urlSelections[key] = value;
        });

        if (data.variants && data.variants.length > 0) {
          // If we have URL selections, use them. Otherwise use first variant.
          if (Object.keys(urlSelections).length > 0) {
            setSelections(urlSelections);
          } else {
            const firstVariant = data.variants[0];
            setSelectedVariant(firstVariant);
            
            const initialSelections: Record<string, string> = {};
            if (firstVariant.attributes instanceof Object) {
              Object.entries(firstVariant.attributes).forEach(([name, value]) => {
                initialSelections[name] = value as string;
              });
            }
            setSelections(initialSelections);
          }
        }
        
        try {
          const reviewsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}/reviews`);
          setReviews(reviewsRes.data);
        } catch (rErr) {
          console.error("Failed to fetch reviews", rErr);
        }
        
        const similarRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=${data.category}`);
        setSimilarProducts(similarRes.data.filter((p: any) => p._id !== data._id).slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Find variant that matches current selections
  useEffect(() => {
    if (!product?.variants) return;

    const matchingVariant = product.variants.find((v: any) => {
      // Check if variant has all current selection values (attributes is now an object/Map)
      return Object.entries(selections).every(([name, value]) => {
        return v.attributes && v.attributes[name] === value;
      });
    });

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  }, [selections, product?.variants]);

  // Helper to get all available values for each attribute name
  const attributeGroups = useMemo(() => {
    if (!product?.variants) return {};
    const groups: Record<string, Set<string>> = {};
    product.variants.forEach((v: any) => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([name, value]) => {
          if (!groups[name]) groups[name] = new Set();
          groups[name].add(value as string);
        });
      }
    });
    return groups;
  }, [product?.variants]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setActiveImgIdx(idx);
    }
  };

  const currentPrice = selectedVariant?.pricing?.salePrice || product?.price || 0;
  const gstRate = selectedVariant?.pricing?.gst || (product?.variants?.[0]?.pricing?.gst) || 0;
  const basePrice = currentPrice / (1 + gstRate / 100);
  const gstAmount = currentPrice - basePrice;
  const currentMrp = selectedVariant?.pricing?.mrp || product?.mrp || 0;
  const currentUnit = selectedVariant && selectedVariant.attributes 
    ? Object.values(selectedVariant.attributes).join(', ') 
    : (product?.unitLabel || 'Standard');

  const currentVariantName = selectedVariant?.name || 'Standard';

  const cartItem = cart.find(item => item.product._id === product?._id && item.selectedVariant === currentVariantName);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product?.brand} ${product?.name}`,
          text: `Check out ${product?.brand} ${product?.name} (${currentUnit}) on MatAll`,
          url: shareUrl,
        });
      } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) return <div className="loading-box">Finding best deals...</div>;
  if (!product) return <div className="no-products">Product not found</div>;

  const images = (selectedVariant?.images && selectedVariant.images.length > 0) 
    ? selectedVariant.images 
    : (product.images && product.images.length > 0 ? product.images : [product.imageUrl]);

  return (
    <div className="blinkit-detail-page">
      <SEO 
        title={`${product.brand} ${product.name}`}
        description={product.description || `Buy ${product.brand} ${product.name} on MatAll. Get it delivered within 60 minutes.`}
        ogImage={getFullImageUrl(images[0])}
      />
      {/* Header */}
      <header className="detail-header-sticky">
        <button className="header-icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title-scroll">
          {product.brand} {product.name}
        </div>
        <div className="header-actions">
           <button className="header-icon-btn" onClick={handleShare}><Share2 size={20} /></button>
        </div>
      </header>

      <div className="detail-content-wrapper main-content-responsive">
        <div className="detail-left-col">
          {/* 1. Image Carousel */}
          <section className="detail-image-section">
            <div className="image-carousel-container">
              <div className="image-snap-track" ref={scrollRef} onScroll={handleScroll}>
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="snap-img-item">
                    <img src={getFullImageUrl(img)} alt={product.name} />
                  </div>
                ))}
              </div>
              <div className="carousel-dots">
                {images.map((_: any, idx: number) => (
                  <div key={idx} className={`dot ${activeImgIdx === idx ? 'active' : ''}`} />
                ))}
              </div>
            </div>

          </section>
        </div>

        <div className="detail-right-col">
          <main className="detail-main-info">
             {/* Metadata */}
             <div className="meta-stats-row">
                <div className={`delivery-mini ${product.deliveryTime === 'On Demand' ? 'on-demand' : ''}`}><Clock size={12} /> <span>{product.deliveryTime || '10 mins'}</span></div>
                <div className="rating-mini">
                   <Star size={12} fill="#facc15" color="#facc15" /> 
                   <span>{(product.avgRating || 0).toFixed(1)}</span> 
                   <span className="count">({product.numReviews || 0})</span>
                </div>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <h1 className="prd-title-large" style={{ flex: 1 }}>
                  <span className="brand-bold-large">{product.brand}</span> {product.name}
               </h1>
               <button 
                 onClick={handleShare}
                 style={{ 
                   background: '#f1f5f9', 
                   border: 'none', 
                   borderRadius: '50%', 
                   width: '40px', 
                   height: '40px', 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   cursor: 'pointer',
                   color: '#1e293b'
                 }}
               >
                 <Share2 size={20} />
               </button>
             </div>
             <div className="prd-unit-label">{currentUnit}</div>

             {/* Multi-Attribute Variant Selector */}
             {Object.keys(attributeGroups).length > 0 && (
               <div className="detail-variants-section">
                  {Object.entries(attributeGroups).map(([name, values]) => (
                    <div key={name} className="v-group-container">
                      <p className="v-section-title">Select {name}</p>
                      <div className="v-chips-row">
                        {Array.from(values).map((val) => (
                          <button 
                            key={val}
                            className={`v-chip-btn ${selections[name] === val ? 'active' : ''}`}
                            onClick={() => setSelections(prev => ({ ...prev, [name]: val }))}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>
             )}

             {/* Fallback to legacy variant chips if no attributes but variants exist */}
             {Object.keys(attributeGroups).length === 0 && product.variants && product.variants.length > 0 && (
               <div className="detail-variants-section">
                  <p className="v-section-title">Select Unit</p>
                  <div className="v-chips-row">
                    {product.variants.map((v: any, idx: number) => (
                      <button 
                        key={idx}
                        className={`v-chip-btn ${selectedVariant?.name === v.name ? 'active' : ''}`}
                        onClick={() => setSelectedVariant(v)}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
               </div>
             )}

             <div className="prd-price-block">
                <div className="prd-price-row">
                   <span className="current-p">₹{currentPrice.toFixed(2)}</span>
                   {currentMrp > currentPrice && <span className="original-mrp">MRP ₹{currentMrp.toFixed(2)}</span>}
                </div>
                <div className="price-gst-breakdown" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                   <span>(₹{basePrice.toFixed(2)} + GST ₹{gstAmount.toFixed(2)})</span>
                </div>
                {currentMrp > currentPrice && (
                  <div className="list-discount-badge-blinkit" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {Math.round(((currentMrp - currentPrice)/currentMrp)*100)}% OFF on MRP
                  </div>
                )}
                {selectedVariant?.pricing?.sellingMeasureRate > 0 && (
                  <div className="selling-rate-info" style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', marginTop: '8px' }}>
                    ₹{Number(selectedVariant.pricing.sellingMeasureRate).toFixed(2)} {product.sellingMeasure || 'per unit'}
                  </div>
                )}
                {selectedVariant?.measure?.value && (
                  <div className="measure-info" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    {selectedVariant.measure.term || 'Net contents'}: {selectedVariant.measure.value} {selectedVariant.measure.unit || ''}
                  </div>
                )}
             </div>

              {/* View Details Dropdown */}
              <div className="view-details-trigger" onClick={() => setShowDetails(!showDetails)}>
                 <span>View product details</span>
                 <ChevronDown size={20} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </div>
              {showDetails && (
                <div className="details-expanded-content">
                   <div className="details-para">
                      {product.description || product.infoPara || "High-quality material sourced for durability and aesthetic perfection."}
                   </div>
                </div>
              )}

              {/* Technical Specifications trigger */}
              <div className="view-details-trigger specs-trigger" onClick={() => setShowSpecs(!showSpecs)} style={{ marginTop: '12px' }}>
                 <span>Technical Specifications</span>
                 <ChevronDown size={20} className={`transition-transform ${showSpecs ? 'rotate-180' : ''}`} />
              </div>
              {showSpecs && (
                <div className="details-expanded-content">
                   <div className="specifications-section">
                      <table className="specs-table">
                         <tbody>
                            <tr>
                               <td className="spec-title">Brand</td>
                               <td className="spec-value">{product.brand}</td>
                            </tr>
                            <tr>
                               <td className="spec-title">Category</td>
                               <td className="spec-value">{product.category}</td>
                            </tr>
                            <tr>
                               <td className="spec-title">Sub-Category</td>
                               <td className="spec-value">{product.subCategory}</td>
                            </tr>
                            
                            {selectedVariant && (
                              <>
                                <tr>
                                   <td className="spec-title">Product Code / SKU Number</td>
                                   <td className="spec-value">{product.productCode} | {selectedVariant.sku}</td>
                                </tr>
                                {selectedVariant.measure?.value && (
                                  <tr>
                                     <td className="spec-title">{selectedVariant.measure.term || 'Measure'}</td>
                                     <td className="spec-value">{selectedVariant.measure.value} {selectedVariant.measure.unit || ''}</td>
                                  </tr>
                                )}
                                {Object.entries(selectedVariant.attributes || {}).map(([k, v]) => (
                                  <tr key={k}>
                                     <td className="spec-title">{k}</td>
                                     <td className="spec-value">{v as string}</td>
                                  </tr>
                                ))}
                                {selectedVariant.inventory?.unitWeight > 0 && (
                                  <tr>
                                     <td className="spec-title">Unit Weight</td>
                                     <td className="spec-value">{selectedVariant.inventory.unitWeight} gm</td>
                                  </tr>
                                )}
                                {selectedVariant.meta?.warranty && (
                                  <tr>
                                     <td className="spec-title">Warranty</td>
                                     <td className="spec-value">{selectedVariant.meta.warranty}</td>
                                  </tr>
                                )}
                                {selectedVariant.meta?.suitableFor && (
                                  <tr>
                                     <td className="spec-title">Suitable For</td>
                                     <td className="spec-value">{selectedVariant.meta.suitableFor}</td>
                                  </tr>
                                )}
                                {selectedVariant.meta?.suppliedWith && (
                                  <tr>
                                     <td className="spec-title">Supplied With</td>
                                     <td className="spec-value">{selectedVariant.meta.suppliedWith}</td>
                                  </tr>
                                )}
                                {selectedVariant.inventory?.bulkApplication && (
                                  <tr>
                                     <td className="spec-title">Application</td>
                                     <td className="spec-value">{selectedVariant.inventory.bulkApplication}</td>
                                  </tr>
                                )}
                              </>
                            )}
                            {product.hsnCode && (
                              <tr>
                                 <td className="spec-title">HSN Code</td>
                                 <td className="spec-value">{product.hsnCode}</td>
                               </tr>
                            )}
                            {product.deliveryTime && (
                              <tr>
                                 <td className="spec-title">Standard Delivery</td>
                                 <td className="spec-value">{product.deliveryTime}</td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>

                   {product.subVariants && product.subVariants.length > 0 && (
                    <div className="specifications-section extra-specs">
                       <h4>Additional Details</h4>
                       <table className="specs-table">
                          <tbody>
                             {product.subVariants.map((sv: any, idx: number) => (
                               <tr key={idx}>
                                  <td className="spec-title">{sv.title}</td>
                                  <td className="spec-value">{sv.value}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  )}
                </div>
              )}

               {/* Return Policy Section - Redesigned */}
              <div className="premium-policy-card">
                <div className="policy-card-header" onClick={() => setShowReturnPolicy(!showReturnPolicy)}>
                  <div className="policy-title-group">
                    <ShieldCheck size={20} className="policy-icon-main" />
                    <h3>Standard Return Policy</h3>
                  </div>
                  <ChevronDown size={20} className={`chevron-policy ${showReturnPolicy ? 'active' : ''}`} />
                </div>
                
                {showReturnPolicy && (
                  <div className="policy-card-body">
                    <div className="policy-intro">
                      Returns are accepted if requested within the defined timeframes and meet the specified conditions.
                    </div>

                    <div className="policy-grid">
                      <div className="policy-item">
                        <div className="policy-item-icon damage">
                           <AlertCircle size={18} />
                        </div>
                        <div className="policy-item-info">
                          <div className="policy-item-row">
                            <span className="policy-label">Damaged Product</span>
                            <span className="policy-badge red">15 Mins</span>
                          </div>
                          <p className="policy-desc">Report any physical damage immediately upon delivery.</p>
                        </div>
                      </div>

                      <div className="policy-item">
                        <div className="policy-item-icon mismatch">
                           <RotateCcw size={18} />
                        </div>
                        <div className="policy-item-info">
                          <div className="policy-item-row">
                            <span className="policy-label">Different Item</span>
                            <span className="policy-badge red">15 Mins</span>
                          </div>
                          <p className="policy-desc">If the delivered product does not match your order.</p>
                        </div>
                      </div>

                      <div className="policy-item">
                        <div className="policy-item-icon hardware">
                           <Info size={18} />
                        </div>
                        <div className="policy-item-info">
                          <div className="policy-item-row">
                            <span className="policy-label">Hardware Fit Issue</span>
                            <span className="policy-badge blue">1 Hour</span>
                          </div>
                          <p className="policy-desc">Items must have original packing, no scratches, and no smudges.</p>
                        </div>
                      </div>
                    </div>

                    <div className="policy-footer">
                       <Info size={14} />
                       <span>Returns must be initiated via the 'My Orders' section in the app.</span>
                    </div>
                  </div>
                )}
              </div>

             {/* Reviews Section */}
             <div className="premium-policy-card" style={{ marginTop: '16px' }}>
                <div className="policy-card-header">
                  <div className="policy-title-group">
                    <Star size={20} className="policy-icon-main" style={{ color: '#f59e0b', background: '#fef3c7' }} />
                    <h3>Customer Reviews ({reviews.length})</h3>
                  </div>
                </div>
                
                <div className="policy-card-body" style={{ padding: '0 1rem 1rem 1rem' }}>
                  {reviews.length === 0 ? (
                    <div style={{ padding: '1rem 0', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                      No reviews yet for this product.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                      {reviews.map((r, idx) => (
                        <div key={idx} style={{ paddingBottom: '1rem', borderBottom: idx !== reviews.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{r.userName || 'Verified Customer'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} fill={s <= r.rating ? "#facc15" : "transparent"} color={s <= r.rating ? "#facc15" : "#cbd5e1"} />
                            ))}
                          </div>
                          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>

             {/* Desktop Add to Cart */}
             <div className="desktop-add-container hide-mobile">
                {location && !location.isServiceable ? (
                   <button className="f-add-btn desktop-add-btn disabled" style={{ background: '#94a3b8' }} disabled>
                     Currently Unavailable
                   </button>
                ) : product.deliveryTime === 'On Demand' ? (
                  <button className="f-add-btn desktop-add-btn on-demand" onClick={() => setShowOnDemandModal(true)}>
                    Request Quote
                  </button>
                ) : cartItem ? (
                  <div className="f-qty-control desktop-qty">
                    <button onClick={() => addToCart(product, -1, currentVariantName)}><Minus size={20} /></button>
                    <span className="f-qty-val">{cartItem.quantity}</span>
                    <button onClick={() => addToCart(product, 1, currentVariantName)}><Plus size={20} /></button>
                  </div>
                ) : (
                  <button className="f-add-btn desktop-add-btn" onClick={() => addToCart(product, 1, currentVariantName)}>
                    Add to cart
                  </button>
                )}
             </div>
          </main>
        </div>
      </div>

      {/* Recommendations */}
      <section className="recommendations-section main-content-responsive">
         <div className="section-head">
            <h3>Similar products</h3>
            <button className="see-all-btn-blinkit">See all <ChevronRight size={14} /></button>
         </div>
         <div className="cat-grid-standard">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
         </div>
      </section>

      {/* Sticky Footer */}
      <footer className="detail-sticky-footer">
          <div className="footer-price-info">
            <span className="f-unit">{currentUnit}</span>
            <span className="f-price">₹{currentPrice.toFixed(2)}</span>
            <span className="f-tax">Inclusive of all taxes</span>
          </div>
         <div className="footer-action">
            {location && !location.isServiceable ? (
              <button className="f-add-btn disabled" style={{ background: '#94a3b8' }} disabled>
                Unavailable
              </button>
            ) : product.deliveryTime === 'On Demand' ? (
              <button className="f-add-btn on-demand" onClick={() => setShowOnDemandModal(true)}>
                Request Quote
              </button>
            ) : cartItem ? (
              <div className="f-qty-control">
                <button onClick={() => addToCart(product, -1, currentVariantName)}><Minus size={20} /></button>
                <span className="f-qty-val">{cartItem.quantity}</span>
                <button onClick={() => addToCart(product, 1, currentVariantName)}><Plus size={20} /></button>
              </div>
            ) : (
              <button className="f-add-btn" onClick={() => addToCart(product, 1, currentVariantName)}>
                Add to cart
              </button>
            )}
         </div>
      </footer>

      <OnDemandModal 
        isOpen={showOnDemandModal}
        onClose={() => setShowOnDemandModal(false)}
        product={product}
        variant={selectedVariant}
      />
    </div>
  );
};

export default ProductDetail;
