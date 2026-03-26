import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  Plus, 
  Minus, 
  ShoppingCart, 
  MapPin, 
  ChevronRight, 
  ChevronUp,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './cart.css';

const Cart: React.FC = () => {
  const { cart, addToCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const cartTotal = totalAmount;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  return (
    <div className="blinkit-cart-page">
      <header className="cart-header-sticky">
        <div className="header-nav-container main-content-responsive" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title">Cart</div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>
      </header>

      <main className="cart-content main-content-responsive">
        <div className="cart-grid-responsive">
          <div className="cart-left-col">
            {/* Order Owner Details */}
            <div className="cart-owner-card">
              <div className="owner-info">
                <span>Order for <strong>{user.fullName || 'Guest'}</strong></span>
                <span className="owner-phone">{user.phoneNumber || '+91 XXXXXXXXXX'}</span>
              </div>
              <button className="change-btn" onClick={() => navigate('/profile')}>Change</button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart-state">
                <ShoppingCart size={64} color="#e2e8f0" />
                <p>Your cart is empty</p>
                <Link to="/products" className="browse-btn">Browse Materials</Link>
              </div>
            ) : (
              <>
                {/* Shipment details */}
                <div className="shipment-info-card">
                  <div className="shipment-header">
                    <Clock size={18} />
                    <span>Delivery in 60 Mins</span>
                  </div>
                  <p className="shipment-sub">Shipment of {cartCount} Item{cartCount > 1 ? 's' : ''}</p>
                  
                  <div className="cart-items-horizontal-scroll">
                    {cart.map((item, idx) => (
                      <div key={idx} className="cart-item-tile">
                        <div className="item-img-box-prd">
                          <img src={getFullImageUrl(item.product.imageUrl)} alt={item.product.name} />
                        </div>
                        <div className="item-details-prd">
                          <h4>{item.product.brand} {item.product.name}</h4>
                          <span className="item-unit-prd">{item.selectedVariant || item.product.unitLabel || 'Standard'}</span>
                          <div className="item-price-info-prd">
                            <span className="item-price-prd">₹{(item.product.salePrice || item.product.price) * item.quantity}</span>
                            {item.product.mrp > (item.product.salePrice || item.product.price) && (
                              <span className="item-mrp-prd">₹{item.product.mrp * item.quantity}</span>
                            )}
                          </div>
                        </div>
                        <div className="item-qty-selector-prd">
                          <button onClick={() => addToCart(item.product, -1, item.selectedVariant)}><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => addToCart(item.product, 1, item.selectedVariant)}><Plus size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* You might also need - PRD Page 32 */}
                <section className="upsell-section-prd">
                  <h3>You might also need</h3>
                  <div className="upsell-scroll-prd">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="upsell-card-prd">
                        <div className="upsell-img-prd">
                           <img src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=150" alt="" />
                        </div>
                        <div className="upsell-info-prd">
                           <p className="upsell-name-prd">Glue Stick 1kg</p>
                           <span className="upsell-price-prd">₹120</span>
                           <button className="add-small-btn-prd">Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-right-col desktop-only-show">
              <div className="bill-summary-card">
                <h3>Bill Summary</h3>
                <div className="bill-row">
                  <span>Items Total</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Charge</span>
                  <span className="free">FREE</span>
                </div>
                <div className="bill-row total">
                  <span>Grand Total</span>
                  <span>₹{cartTotal}</span>
                </div>
                
                <div className="address-tab-row mt-4" onClick={() => navigate('/checkout')}>
                  <div className="addr-icon-box"><MapPin size={20} /></div>
                  <div className="addr-text-box">
                    <span className="addr-label">Delivering to <strong>Home</strong></span>
                    <p className="addr-preview">Plot XY, Random Road...</p>
                  </div>
                  <ChevronRight size={20} />
                </div>

                <button className="place-order-btn-desktop" onClick={() => navigate('/checkout')}>
                  Place Order <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {cart.length > 0 && (
        <footer className="cart-footer-fixed">
          <div className="payment-method-toggle">
            <span>PAY USING <strong>UPI</strong></span>
            <ChevronUp size={16} />
          </div>
          <button className="place-order-btn" onClick={() => navigate('/checkout')}>
            <div className="btn-price-col">
              <span className="btn-total">₹{cartTotal}</span>
              <span className="btn-label">Order Total</span>
            </div>
            <div className="btn-action-col">
              Place Order <ArrowRight size={20} />
            </div>
          </button>
        </footer>
      )}
    </div>
  );
};

export default Cart;
