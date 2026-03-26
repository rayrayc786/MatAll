import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Share2, 
  Search, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './product-detail.css';
import toast from 'react-hot-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('specs');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.brand} ${product?.name} on MatAll`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      toast.success('Link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) return <div className="loading-box">Loading details...</div>;
  if (!product) return <div>Product not found</div>;

  const toggleTab = (tab: string) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  // Multiple images logic (fallback to single if array empty)
  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  return (
    <div className="blinkit-detail-page">
      <header className="detail-header-sticky">
        <div className="header-nav-container main-content-responsive" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title">{product.name || 'Details'}</div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>
      </header>

      <main className="detail-content main-content-responsive">
        <div className="detail-image-section">
          <div className="image-horizontal-scroll">
            {images.map((img: string, idx: number) => (
              <div key={idx} className="scroll-img-item">
                <img src={img} alt={`${product.name} ${idx}`} />
              </div>
            ))}
          </div>
          <div className="image-actions-overlay">
            <button className="img-action-btn"><Search size={20} /></button>
            <button className="img-action-btn" onClick={handleShare}><Share2 size={20} /></button>
          </div>
        </div>

        <div className="detail-info-card">
          <h1 className="detail-product-name-format">
            {product.brand} {product.name}
          </h1>

          {product.infoPara && (
            <div className="detail-info-para" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>
              <p>{product.infoPara}</p>
            </div>
          )}

          <div className="detail-dropdowns-prd">
            {/* Specifications */}
            <div className="dropdown-item-prd">
              <div className="dropdown-header-prd" onClick={() => toggleTab('specs')}>
                <span>Specifications</span>
                <ChevronDown size={20} className={`transition-transform ${activeTab === 'specs' ? 'rotate-180' : ''}`} />
              </div>
              <div className={`dropdown-content-prd ${activeTab === 'specs' ? 'open' : ''}`}>
                <div className="spec-table">
                  <div className="spec-row"><span>Category</span> <span>{product.category}</span></div>
                  <div className="spec-row"><span>Sub Category</span> <span>{product.subCategory}</span></div>
                  <div className="spec-row"><span>SKU</span> <span>{product.sku}</span></div>
                  <div className="spec-row"><span>Unit</span> <span>{product.unitLabel}</span></div>
                </div>
              </div>
            </div>

            {/* Return & Info */}
            <div className="dropdown-item-prd">
              <div className="dropdown-header-prd" onClick={() => toggleTab('return')}>
                <span>Return & other information</span>
                <ChevronDown size={20} className={`transition-transform ${activeTab === 'return' ? 'rotate-180' : ''}`} />
              </div>
              <div className={`dropdown-content-prd ${activeTab === 'return' ? 'open' : ''}`}>
                <div className="info-text">
                  <p>• Standard 7-day replacement policy.</p>
                  <p>• Logistics handling fees may apply for returns.</p>
                  <p>• Manufacturer warranty applicable as per brand policy.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-extra-links-prd">
            <Link to={`/brand/${product.brand}`} className="extra-link-prd">
              <div className="link-text">
                <span>Explore {product.brand} Products</span>
              </div>
              <ChevronRight size={20} />
            </Link>
            <Link to={`/products?category=${product.category}`} className="extra-link-prd">
              <div className="link-text">
                <span>Similar Products</span>
              </div>
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </main>

      <footer className="detail-footer-fixed">
        <div className="price-info-footer">
          <div className="price-row-main">
            <span className="sale-price">Rs. {product.price}</span>
            <span className="mrp-strikethrough">MRP {product.mrp}</span>
          </div>
          <span className="tax-info-label">incl. of all taxes</span>
        </div>
        <div className="detail-actions-footer">
          <button className="buy-now-btn-prd" onClick={() => { addToCart(product, 1); navigate('/checkout'); }}>
            Buy Now
          </button>
          <button className="add-to-cart-btn-prd" onClick={() => addToCart(product, 1)}>
            Add to cart
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
