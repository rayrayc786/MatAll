import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Truck, ArrowRight, Package, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const Cart: React.FC = () => {
  const { cart, removeFromCart, totalAmount, totalWeight, vehicleClass, addToCart } = useCart();

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  if (cart.length === 0) {
    return (
      <main className="content empty-cart-container">
        <div className="empty-cart-card">
          <div className="empty-icon-wrap">
            <Package size={64} color="#94a3b8" />
          </div>
          <h2>Your jobsite cart is empty</h2>
          <p>You haven't added any industrial materials to your procurement list yet.</p>
          <Link to="/products" className="btn-primary-lg">Browse Materials <ArrowRight size={20} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="content cart-page-modern">
      <header className="cart-header">
        <h1>Procurement Cart</h1>
        <div className="cart-meta">
          <span className="items-count">{cart.length} Industrial Items</span>
          <span className="divider">|</span>
          <span className="project-tag">Project: standard_delivery_01</span>
        </div>
      </header>
      
      <div className="cart-grid-modern">
        <div className="cart-items-section">
          {cart.map((item) => (
            <div key={item.product._id + (item.selectedVariant || '')} className="cart-item-card-modern">
              <div className="item-img">
                <img 
                  src={getFullImageUrl(item.product.imageUrl)} 
                  alt={item.product.name} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=200';
                  }}
                />
              </div>
              <div className="item-details">
                <div className="item-main">
                  <h3>{item.product.name}</h3>
                  <div className="item-tags">
                    <span className="tag-sku">SKU: {item.product.sku}</span>
                    {item.selectedVariant && <span className="tag-variant">{item.selectedVariant}</span>}
                  </div>
                </div>
                <div className="item-procurement">
                  <div className="quantity-modern">
                    <button onClick={() => addToCart(item.product, -1, item.selectedVariant)} disabled={item.quantity <= 1}><Minus size={14} /></button>
                    <input type="number" value={item.quantity} readOnly />
                    <button onClick={() => addToCart(item.product, 1, item.selectedVariant)}><Plus size={14} /></button>
                  </div>
                  <button className="btn-remove-text" onClick={() => removeFromCart(item.product._id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="item-financials">
                <div className="unit-price">₹{item.product.price.toFixed(2)} / unit</div>
                <div className="total-price">₹{(item.product.price * item.quantity).toFixed(2)}</div>
                <div className="total-weight">{(item.product.weightPerUnit * item.quantity).toLocaleString()} kg</div>
              </div>
            </div>
          ))}
          
          <div className="cart-bundles-modern card">
            <div className="bundle-header">
              <ShieldCheck size={20} color="#16a34a" />
              <h3>Optimization Suggestions</h3>
            </div>
            <div className="suggestion-item">
              <p>Add <strong>10 tons of M-Sand</strong> to your order to unlock <strong>12% bulk discount</strong> on Cement.</p>
              <button className="btn-secondary-sm">Add Now</button>
            </div>
          </div>
        </div>

        <aside className="cart-sidebar-sticky">
          <div className="summary-card-modern card">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="s-row">
                <span>Items Subtotal</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="s-row">
                <span>Logistics Weight</span>
                <span>{totalWeight.toLocaleString()} kg</span>
              </div>
              <div className="s-row">
                <span>Tax (GST 18%)</span>
                <span>₹{(totalAmount * 0.18).toFixed(2)}</span>
              </div>
              
              <div className="vehicle-assignment">
                <div className="v-icon-wrap"><Truck size={20} /></div>
                <div className="v-info">
                  <span className="v-label">Assigned Vehicle</span>
                  <span className="v-value">{vehicleClass}</span>
                </div>
              </div>
            </div>

            <div className="summary-total-box">
              <div className="total-main">
                <span>Grand Total</span>
                <span className="total-amount">₹{(totalAmount * 1.18).toFixed(2)}</span>
              </div>
              <p className="savings-msg">You are saving ₹142.00 on this order</p>
            </div>

            <Link to="/checkout" className="btn-checkout-primary">
              Proceed to Secure Checkout <ArrowRight size={20} />
            </Link>
            
            <div className="trust-badges">
              <div className="t-badge"><ShieldCheck size={14} /> Quality Assured</div>
              <div className="t-badge"><Truck size={14} /> On-time Delivery</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
