import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './floating-cart.css';

const FloatingCart: React.FC = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cart.reduce((acc, item) => {
    const itemPrice = item.product.variants && item.product.variants.length > 0
      ? (item.product.variants.find((v: any) => v.name === item.selectedVariant)?.price || item.product.price)
      : item.product.price;
    return acc + (itemPrice * item.quantity);
  }, 0);

  // Don't show on cart, checkout or payment pages
  const hideOnPages = ['/cart', '/checkout', '/payment', '/login'];
  if (hideOnPages.includes(location.pathname) || totalCartCount === 0) {
    return null;
  }

  // Check if we are on admin/rider/supplier pages
  if (location.pathname.startsWith('/admin') || 
      location.pathname.startsWith('/rider') || 
      location.pathname.startsWith('/supplier')) {
    return null;
  }

  const isProductDetail = location.pathname.startsWith('/products/');
  const showBottomNav = !location.pathname.startsWith('/admin') && 
                        !location.pathname.startsWith('/rider') && 
                        !location.pathname.startsWith('/supplier') && 
                        !location.pathname.startsWith('/payment');

  return (
    <div 
      className={`floating-cart-pill ${isProductDetail ? 'on-detail-page' : ''} ${showBottomNav ? 'with-bottom-nav' : ''}`} 
      onClick={() => navigate('/cart')}
    >
      <div className="cart-pill-icon">
        <ShoppingCart size={18} />
      </div>
      <div className="cart-pill-text">
        <h5>View cart</h5>
        <p>{totalCartCount} item{totalCartCount > 1 ? 's' : ''} • ₹{totalCartAmount}</p>
      </div>
      <ChevronRight size={18} />
    </div>
  );
};

export default FloatingCart;
