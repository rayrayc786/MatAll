import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageUrl';
import './cart.css';

const Cart: React.FC = () => {
  const { cart, addToCart, removeFromCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState('15 mins');

  // Same fee logic as Checkout.tsx
  const deliveryCharge = totalAmount > 5000 ? 0 : 150;
  const handlingCharge = 25;
  const grandTotal = totalAmount + deliveryCharge + handlingCharge;

  useEffect(() => {
    if (cart.length > 0) {
      // Find the slowest delivery time
      const times = cart.map(item => item.product.deliveryTime || '15 mins');
      let slowest = times[0];
      times.forEach(t => {
        if (t.toLowerCase().includes('day')) slowest = t;
        else if (t.toLowerCase().includes('hour') && !slowest.toLowerCase().includes('day')) slowest = t;
        else if (parseInt(t) > parseInt(slowest) && !slowest.toLowerCase().includes('hour') && !slowest.toLowerCase().includes('day')) slowest = t;
      });
      setMaxDeliveryTime(slowest);
    }
  }, [cart]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
        setRecommendations(data.slice(4, 10));
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecs();
  }, []);

  const handleMoveToWishlist = async (product: any, variant?: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to use wishlist');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/favorites/toggle`, 
        { productId: product._id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      removeFromCart(product._id, variant);
      toast.success('Moved to wishlist!', { icon: '❤️' });
    } catch (err) {
      toast.error('Failed to move to wishlist');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="blinkit-cart-page">
        <div className="cart-empty-lux main-content-responsive">
          <ShoppingCart size={80} strokeWidth={1.5} color="#e2e8f0" />
          <h2>Your cart is empty</h2>
          <p>Add some products to witness the magic of Blinkit-style shopping!</p>
          <Link to="/products" className="f-add-btn" style={{ textDecoration: 'none' }}>Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blinkit-cart-page">
      <main className="checkout-content main-content-responsive">
        <div className="checkout-grid-responsive">
          <div className="checkout-left-col">
            <div className="shipment-container">
              <div className="ship-head-row">
                <div className="ship-timer-icon"><Clock size={18} /></div>
                <div className="ship-timer-text">
                  <h4>Delivery in {maxDeliveryTime}</h4>
                  <p>Shipment of {cart.length} item{cart.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="cart-list-vertical">
                {cart.map((item, idx) => (
                  <div key={idx} className="cart-item-row-blinkit">
                    <div className="c-item-img">
                      <img 
                        src={getFullImageUrl(item.product.imageUrl || (item.product.images && item.product.images[0]))} 
                        alt={item.product.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div className="c-item-info">
                      <h5>{item.product.brand} {item.product.name}</h5>
                      <div className="c-item-meta-row">
                        <span className="c-item-unit">{item.selectedVariant || item.product.unitLabel || 'Standard'}</span>
                        <button 
                           className="c-item-wishlist"
                           onClick={() => handleMoveToWishlist(item.product, item.selectedVariant)}
                        >
                          Move to wishlist
                        </button>
                      </div>
                      
                      <div className="c-item-qty-price-row">
                        <div className="c-qty-box">
                          <button onClick={() => addToCart(item.product, -1, item.selectedVariant)}><Minus size={14} /></button>
                          <span className="c-qty-val">{item.quantity}</span>
                          <button onClick={() => addToCart(item.product, 1, item.selectedVariant)}><Plus size={14} /></button>
                        </div>
                        <span className="c-item-price">₹{(item.product.salePrice || item.product.price) * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bill-summary-pod hide-desktop">
              <h3>Bill Summary</h3>
              <div className="bill-row-item">
                <span>Item Total</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="bill-row-item">
                <span>Delivery Charge</span>
                {deliveryCharge > 0 ? <span>₹{deliveryCharge}</span> : <span style={{ color: '#16a34a' }}>FREE</span>}
              </div>
              <div className="bill-row-item">
                <span>Handling Charge</span>
                <span>₹{handlingCharge}</span>
              </div>
              <div className="bill-row-total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <section className="upsell-full-section">
              <h3>You might also like</h3>
              <div className="cat-grid-standard">
                {recommendations.map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>
          </div>

          <div className="checkout-right-col">
            <section className="checkout-section">
              <div className="section-title-row">
                <Receipt size={18} />
                <h3>Bill Summary</h3>
              </div>
              <div className="bill-card">
                <div className="bill-row-checkout">
                  <span>Item Total</span>
                  <span className="bill-val">₹{totalAmount}</span>
                </div>
                <div className="bill-row-checkout">
                  <span>Delivery Charge</span>
                  <span className="bill-val">
                    {deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="free">FREE</span>}
                  </span>
                </div>
                <div className="bill-row-checkout">
                  <span>Handling Charge</span>
                  <span className="bill-val">₹{handlingCharge}</span>
                </div>
                <div className="bill-row-checkout grand-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-val">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <div className="desktop-order-actions hide-mobile mt-4">
              <button className="final-place-btn-desktop" onClick={() => {
                if (!localStorage.getItem('token')) {
                  toast.error('Please login to continue to checkout');
                  navigate('/login', { state: { from: '/cart' } });
                } else {
                  navigate('/checkout');
                }
              }}>
                Place Order • ₹{grandTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="checkout-footer-stack">
        <div className="addr-summary-bar" onClick={() => navigate('/checkout')}>
          <div className="addr-icon-pill"><MapPin size={18} /></div>
          <div className="addr-text-pill">
            <p>Delivering to Home</p>
            <span>Mattaur, Sector 70, Sahibzada Ajit Singh Nagar, Punjab...</span>
          </div>
          <button className="addr-change-btn">Change</button>
        </div>

        <div className="payment-place-order-bar" onClick={() => {
          if (!localStorage.getItem('token')) {
            toast.error('Please login to continue to checkout');
            navigate('/login', { state: { from: '/cart' }, replace: true });
          } else {
            navigate('/checkout');
          }
        }}>
          <div className="pay-info-left">
            <div className="pay-total-row">
              <span>₹{grandTotal.toFixed(2)}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>NEXT STEP</span>
            </div>
          </div>
          <div className="place-order-right-btn">
            Next <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
