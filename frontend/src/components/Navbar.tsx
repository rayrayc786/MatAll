import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LayoutDashboard, LogOut, ClipboardList, Menu, MapPin, X, ChevronDown, Heart } from 'lucide-react';
import axios from 'axios';

import { useCart } from '../contexts/CartContext';
import AISearch from './AISearch';
import LocationSelector from './LocationSelector';
import './navbar.css';
import LocationModal from './LocationModal';

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default to true for SSR/initial, update in effect
  
  const { cart, totalAmount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isHomePage = location.pathname === '/';

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 850);
    handleResize(); // Set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Logic to determine if we should hide the global navbar on mobile
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

  // On mobile, if it has a custom header, hide this navbar
  if (!isDesktop && hasCustomHeader) return null;

  const isBlinkitHeader = !isLoggedIn && isDesktop;

  return (
    <header className={`navbar-new-layout ${isHomePage ? 'landing-header-wrapper' : ''}`}>
      {(isHomePage && !isDesktop) ? (
        <LocationSelector />
      ) : isBlinkitHeader ? (
        <>
          <div className="standard-navbar main-content-responsive">
            <div className="nav-left">
              <div className="logo-container">
                <Link to="/" className="logo">Mat<span>All</span></Link>
              </div>
              <LocationSelectorInNav isBlinkitStyle={true} />
            </div>
            
            <div className="search-container-main">
              <form className="search-bar" onSubmit={handleSearch}>
                <Search size={18} className="search-icon" color="#333" />
                <input 
                  type="text" 
                  placeholder='Search products' 
                  value={searchTerm}
                  onChange={onInputChange}
                />
                <AISearch />
              </form>
            </div>

            <div className="nav-actions">
              <Link to="/login" className="nav-link-login-text">
                Login
              </Link>
              
              <Link to="/cart" className="cart-button-blinkit">
                <ShoppingCart size={20} />
                <span>My Cart</span>
              </Link>
            </div>
          </div>
          {/* {!hasCustomHeader && (
            <div className="navbar-sub-header">
              <div className="main-content-responsive sub-header-content">
                <span className="quick-links-label">Shop by Category</span>
                <div className="quick-links-list">
                  <Link to="/category/03" className="quick-link-pill">Plywood</Link>
                  <Link to="/category/22" className="quick-link-pill">Hardware</Link>
                  <Link to="/category/03" className="quick-link-pill">Laminate</Link>
                  <Link to="/products?category=tools" className="quick-link-pill">Tools</Link>
                  <Link to="/category/04" className="quick-link-pill">Electrical</Link>
                </div>
              </div>
            </div>
          )} */}
        </>
      ) : (
        <div className="standard-navbar main-content-responsive">
          <div className="nav-left">
            <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="logo">MatAll</Link>
            {isDesktop && <LocationSelectorInNav isBlinkitStyle={false} />}
          </div>
          
          <div className="search-container-main">
            <form className="search-bar" onSubmit={handleSearch}>
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder='Search products...' 
                value={searchTerm}
                onChange={onInputChange}
              />
              <AISearch />
            </form>
          </div>

          <div className={`nav-actions ${isMenuOpen ? 'open' : ''}`}>
            {isDesktop && (
              <Link to="/products" className="browse-materials-btn">
                Shop
              </Link>
            )}
            
            <div className="user-controls-group">
              {isLoggedIn && (
                <Link to="/orders" className="control-icon-btn" title="My Orders">
                  <ClipboardList size={20} />
                  <span className="nav-text-mobile">Orders</span>
                </Link>
              )}
              
              {isLoggedIn && (
                <Link to="/favorites" className="control-icon-btn" title="My Favorites">
                  <Heart size={20} />
                  <span className="nav-text-mobile">Favorites</span>
                </Link>
              )}
              
              {isLoggedIn && user.role === 'Admin' && (
                <Link to="/admin" className="control-icon-btn admin-link" title="Admin Dashboard">
                  <LayoutDashboard size={20} />
                  <span className="nav-text-mobile">Admin</span>
                </Link>
              )}

              {isLoggedIn ? (
                <>
                  <Link to="/profile" className="control-icon-btn profile-btn" title="My Profile">
                    <User size={20} />
                    <span className="nav-text-mobile">Profile</span>
                  </Link>
                  {isDesktop && (
                    <button onClick={handleLogout} className="control-icon-btn logout-btn" title="Logout">
                      <LogOut size={18} />
                    </button>
                  )}
                </>
              ) : (
                <Link to="/login" className="nav-link-login-desktop">
                  Login
                </Link>
              )}
            </div>
          </div>

          <div className="nav-right-cart">
            <Link to="/cart" className={`cart-badge-desktop ${cartCount > 0 ? 'has-items' : ''}`}>
              <div className="cart-icon-wrapper">
                <ShoppingCart size={24} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </div>
              {isDesktop && cartCount > 0 && (
                <div className="cart-info-desktop">
                  <span className="cart-total-text">₹{totalAmount}</span>
                  <span className="cart-label-text">VIEW CART</span>
                </div>
              )}
              {isDesktop && cartCount === 0 && (
                <span className="cart-text-empty">My Cart</span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

const LocationSelectorInNav = ({ isBlinkitStyle }: { isBlinkitStyle?: boolean }) => {
  const [address, setAddress] = useState<string>('Detecting...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (isLoggedIn && user.jobsites && user.jobsites.length > 0) {
      setAddress(user.jobsites[0].addressText);
    } else {
      detectLocation();
    }
  }, [isLoggedIn]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setAddress('Provide Location');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const addressData = data.address;
          const conciseAddr = addressData.suburb || addressData.neighbourhood || addressData.city_district || addressData.town || addressData.city;
          const fullAddress = conciseAddr ? `${conciseAddr}, ${addressData.city || addressData.state || ''}` : data.display_name;
          setAddress(fullAddress);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setAddress(`Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setAddress('Provide Location');
      }
    );
  };

  if (isBlinkitStyle) {
    return (
      <div className="delivery-info-container" onClick={() => setIsModalOpen(true)}>
        <span className="delivery-title">Delivery in 8 minutes</span>
        <div className="delivery-address-wrapper">
          <span className="delivery-address">{address}</span>
          <ChevronDown size={14} />
        </div>
        <LocationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSelectAddress={(addr) => setAddress(addr)}
          currentAddress={address}
        />
      </div>
    );
  }

  return (
    <div className="location-nav-trigger" onClick={() => setIsModalOpen(true)}>
      <MapPin size={18} />
      <span className="addr-nav-text">{address}</span>
      <ChevronDown size={14} />
      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectAddress={(addr) => setAddress(addr)}
        currentAddress={address}
      />
    </div>
  );
};

export default Navbar;
