import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, RotateCcw, ShoppingCart, Headphones, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './footer.css';

const Footer: React.FC = () => {
  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const location = useLocation();


  const isActive = (path: string) => location.pathname === path;

  return (
    <footer className="landing-footer">
      <Link to="/" className={`footer-item ${isActive('/') ? 'active' : ''}`}>
        <Home size={22} />
        <span>Home</span>
      </Link>
      <Link to="/orders" className={`footer-item ${isActive('/orders') ? 'active' : ''}`}>
        <RotateCcw size={22} />
        <span>Orders</span>
      </Link>
      <Link to="/products" className={`footer-item ${isActive('/products') ? 'active' : ''}`}>
        <ShoppingBag size={22} />
        <span>Shop</span>
      </Link>
      <Link to="/cart" className={`footer-item ${isActive('/cart') ? 'active' : ''}`}>
        <div className="footer-cart-icon">
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
        </div>
        <span>Cart</span>
      </Link>
      <Link to="/support" className={`footer-item ${isActive('/support') ? 'active' : ''}`}>
        <Headphones size={22} />
        <span>Support</span>
      </Link>
    </footer>
  );
};

export default Footer;
