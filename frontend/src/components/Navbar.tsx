import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LayoutDashboard, Truck, LogOut, Package, ClipboardList, Heart, Menu, X } from 'lucide-react';

import { useCart } from '../contexts/CartContext';
import AISearch from './AISearch';
import LocationSelector from './LocationSelector';
import './navbar.css';

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isHomePage = location.pathname === '/';
  const isProductListPage = location.pathname === '/products';

  useEffect(() => {
    setIsMenuOpen(false); // Close menu on route change
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${searchTerm}`);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Logic to determine if we should hide the global navbar
  const customHeaderPaths = [
    '/search', 
    '/products', 
    '/cart', 
    '/checkout', 
    '/payment', 
    '/support', 
    '/profile', 
    '/orders',
    '/favorites'
  ];

  const hasCustomHeader = customHeaderPaths.includes(location.pathname) || 
                          location.pathname.startsWith('/category/') || 
                          location.pathname.startsWith('/brand/') ||
                          location.pathname.startsWith('/products/') ||
                          location.pathname.startsWith('/tracking/');

  if (hasCustomHeader) return null;

  return (
    <header className={`navbar-new-layout ${isHomePage ? 'landing-header-wrapper' : ''}`}>
      {isHomePage ? (
        <LocationSelector />
      ) : (
        <div className="standard-navbar">
          <div className="nav-left">
            <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="logo">MatAll</Link>
          </div>
          
          {!isProductListPage && (
            <div className="search-container-main">
              <form className="search-bar" onSubmit={handleSearch}>
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder='Search "cement"' 
                  value={searchTerm}
                  onChange={onInputChange}
                />
                <AISearch />
              </form>
            </div>
          )}

          <div className={`nav-actions ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/products" className="nav-link">Materials</Link>
            
            {isLoggedIn && (
              <>
                <Link to="/favorites" className="nav-link" title="Favorites">
                  <Heart size={22} className="nav-icon-desktop" />
                  <span className="nav-text-mobile">Favorites</span>
                </Link>
                <Link to="/orders" className="nav-link">
                  <ClipboardList size={18} /> <span>Orders</span>
                </Link>
              </>
            )}
            
            {isLoggedIn && user.role === 'Admin' && (
              <Link to="/admin" className="nav-link admin-link">
                <LayoutDashboard size={18} /> <span>Admin</span>
              </Link>
            )}
            
            {isLoggedIn && user.role === 'Driver' && (
              <Link to="/driver" className="nav-link driver-link">
                <Truck size={18} /> <span>Driver Portal</span>
              </Link>
            )}

            {isLoggedIn && user.role === 'Vendor' && (
              <Link to="/vendor" className="nav-link vendor-link">
                <Package size={18} /> <span>Vendor Portal</span>
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link to="/profile" className="nav-link user-profile-link">
                  <User size={24} /> <span className="nav-text-mobile">Profile</span>
                </Link>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  <LogOut size={20} /> <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link">
                <User size={24} /> <span>Login</span>
              </Link>
            )}
          </div>

          <Link to="/cart" className="cart-badge">
            <ShoppingCart size={24} />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
