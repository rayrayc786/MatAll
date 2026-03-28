import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Share2, 
  Search, 
  Heart,
  ChevronRight,
  ChevronDown,
  Clock,
  Star,
  Plus,
  Minus,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import './product-detail.css';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        
        // Fetch similar products in same category
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

  const handleScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
      setActiveImgIdx(idx);
    }
  };

  const currentVariantName = selectedVariant?.name || 'Standard';
  const currentPrice = selectedVariant ? selectedVariant.price : (product?.salePrice || product?.price);
  const currentMrp = selectedVariant ? selectedVariant.mrp : (product?.mrp || 0);
  const currentUnit = selectedVariant?.name || product?.unitLabel || 'Piece';

  const cartItem = cart.find(item => item.product._id === product?._id && item.selectedVariant === currentVariantName);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cart.reduce((acc, item) => {
    const itemPrice = item.product.variants && item.product.variants.length > 0
      ? (item.product.variants.find((v: any) => v.name === item.selectedVariant)?.price || item.product.price)
      : item.product.price;
    return acc + (itemPrice * item.quantity);
  }, 0);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.brand} ${product?.name} on BuildItQuick`,
          url: window.location.href,
        });
      } catch (err) { console.error(err); }
    } else {
      toast.success('Link copied!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) return <div className="loading-box">Finding best deals...</div>;
  if (!product) return <div className="no-products">Product not found</div>;

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  return (
    <div className="blinkit-detail-page">
      {/* Header */}
      <header className="detail-header-sticky">
        <button className="header-icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title-scroll">
          {product.brand} {product.name}
        </div>
        <div className="header-actions">
           <button className="header-icon-btn"><Heart size={20} /></button>
           <button className="header-icon-btn"><Search size={20} /></button>
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
                    <img src={img} alt={product.name} />
                  </div>
                ))}
              </div>
              <div className="carousel-dots">
                {images.map((_: any, idx: number) => (
                  <div key={idx} className={`dot ${activeImgIdx === idx ? 'active' : ''}`} />
                ))}
              </div>
            </div>

            {/* highlights row */}
            <div className="highlights-scroll-row">
               <div className="highlight-chip">
                  <span className="h-label">Shelf Life</span>
                  <span className="h-value">150 days</span>
               </div>
               <div className="highlight-chip">
                  <span className="h-label">Type</span>
                  <span className="h-value">{product.category || 'Standard'}</span>
               </div>
               <div className="highlight-chip">
                  <span className="h-label">SKU</span>
                  <span className="h-value">{product.sku || 'Mat-X'}</span>
               </div>
            </div>
          </section>
        </div>

        <div className="detail-right-col">
          <main className="detail-main-info">
             {/* Metadata */}
             <div className="meta-stats-row">
                <div className="delivery-mini"><Clock size={12} /> <span>10 mins</span></div>
                <div className="rating-mini">
                   <Star size={12} fill="#facc15" color="#facc15" /> 
                   <span>4.5</span> 
                   <span className="count">(3.2 lac)</span>
                </div>
             </div>

             <h1 className="prd-title-large">
                <span className="brand-bold-large">{product.brand}</span> {product.name}
             </h1>
             <div className="prd-unit-label">{currentUnit}</div>

             {/* Variant Selector */}
             {product.variants && product.variants.length > 0 && (
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
                   <span className="current-p">₹{currentPrice}</span>
                   {currentMrp > currentPrice && <span className="original-mrp">MRP ₹{currentMrp}</span>}
                </div>
                {currentMrp > currentPrice && (
                  <div className="list-discount-badge-blinkit" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    {Math.round(((currentMrp - currentPrice)/currentMrp)*100)}% OFF on MRP
                  </div>
                )}
             </div>

             {/* View Details Dropdown */}
             <div className="view-details-trigger" onClick={() => setShowDetails(!showDetails)}>
                <span>View product details</span>
                <ChevronDown size={20} className={`transition-transform ${showDetails ? 'rotate-180' : ''}`} />
             </div>
             {showDetails && (
               <div className="details-expanded-text" style={{ padding: '1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {product.infoPara || "High-quality material sourced for durability and aesthetic perfection."}
               </div>
             )}

             {/* Desktop Add to Cart */}
             <div className="desktop-add-container hide-mobile">
                {cartItem ? (
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
            <span className="f-price">₹{currentPrice}</span>
            <span className="f-tax">Inclusive of all taxes</span>
         </div>
         <div className="footer-action">
            {cartItem ? (
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

      {/* Floating Cart Pill */}
      {totalCartCount > 0 && (
        <div className="floating-cart-pill" onClick={() => navigate('/cart')}>
           <div className="cart-pill-icon">
              <ShoppingCart size={18} />
           </div>
           <div className="cart-pill-text">
              <h5>View cart</h5>
              <p>{totalCartCount} item • ₹{totalCartAmount}</p>
           </div>
           <ChevronRight size={18} />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
