import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LayoutDashboard, LogOut, ClipboardList, Menu, MapPin, X, ChevronDown, Heart, Headset } from 'lucide-react';
import axios from 'axios';

import { useCart } from '../contexts/CartContext';
import { useLocationContext } from '../contexts/LocationContext';
import AISearch from './AISearch';
import LocationSelector from './LocationSelector';
import './navbar.css';
import LocationModal from './LocationModal';
import logoImg from '../assets/logo.jpeg';

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isHomePage = location.pathname === '/';
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 850);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
          const { data } = await axios.get(`${baseUrl}/api/products/autocomplete?q=${searchTerm}`);
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Suggestions error:', err);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    setIsMenuOpen(false);
    setShowSuggestions(false);
    setSearchTerm('');
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionClick = (s: any) => {
    setSearchTerm(s.name);
    setShowSuggestions(false);
    navigate(`/products/${s._id}`);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Logic to determine if we should hide the global navbar on mobile
  const customHeaderPaths = [
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

  const isMatallHeader = !isLoggedIn && isDesktop;

  const renderSearchBar = () => (
    <div className="search-row-main-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', flex: 1 }}>
      <div className="search-container-main" ref={suggestionRef}>
        <form className="search-bar" onSubmit={handleSearch}>
          <Search size={20} className="search-icon" color="#333" />
          <input 
            type="text" 
            placeholder='Search (e.g. Pipe, Wire)...' 
            value={searchTerm}
            onChange={onInputChange}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          />
          <AISearch />
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions-dropdown">
            {suggestions.map((s) => (
              <div 
                key={s._id} 
                className="suggestion-item"
                onClick={() => handleSuggestionClick(s)}
              >
                <div className="s-info">
                  <span className="s-brand">{s.brand}</span>
                  <span className="s-name">{s.productName || s.name}</span>
                </div>
                <span className="s-price">₹{Number(s.pricing?.salePrice || s.price || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!isDesktop && (
        <Link to="/favorites" className="wishlist-header-btn">
          <Heart size={24} />
        </Link>
      )}
    </div>
  );

  return (
    <header className={`navbar-new-layout ${isHomePage ? 'landing-header-wrapper' : ''}`}>
      {(isHomePage && !isDesktop) ? (
        <LocationSelector searchNode={renderSearchBar()} />
      ) : isMatallHeader ? (
        <>
          <div className="standard-navbar main-content-responsive">
            <div className="nav-left">
              <div className="logo-container">
                <Link to="/" className="logo">
                  <img src={logoImg} alt="MatAll" className="navbar-logo-img" />
                </Link>
              </div>
              <LocationSelectorInNav ismatallStyle={true} />
            </div>
            
            {renderSearchBar()}

            <div className="nav-actions">
              <Link to="/login" className="nav-link-login-text">
                Login
              </Link>
              
              <Link to="/cart" className="cart-button-matall">
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
            <Link to="/" className="logo">
              <img src={logoImg} alt="MatAll" className="navbar-logo-img" />
            </Link>
            {isDesktop && <LocationSelectorInNav ismatallStyle={false} />}
          </div>
          
          {renderSearchBar()}

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
              
              <Link to="/support" className="control-icon-btn" title="Support">
                <Headset size={20} />
                <span className="nav-text-mobile">Support</span>
              </Link>
              
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
                  {/* <span className="cart-total-text">₹{totalAmount.toFixed(2)}</span> */}
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

const LocationSelectorInNav = ({ ismatallStyle }: { ismatallStyle?: boolean }) => {
  const { location, setLocation } = useLocationContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayAddress = location?.address || 'Detecting...';

  const handleSelectAddress = (addr: string, coords: [number, number]) => {
    setLocation({
      address: addr,
      coords: { lat: coords[1], lng: coords[0] },
      isServiceable: true // Assuming manually selected are serviceable or checked in modal
    }, true); // Mark as manual selection
  };

  if (ismatallStyle) {
    return (
      <div className="delivery-info-container" onClick={() => setIsModalOpen(true)}>
        <span className="delivery-title">Delivery in 60 minutes</span>
        <div className="delivery-address-wrapper">
          <span className="delivery-address">{displayAddress}</span>
          <ChevronDown size={14} />
        </div>
        <LocationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSelectAddress={handleSelectAddress}
          currentAddress={displayAddress}
        />
      </div>
    );
  }

  return (
    <div className="location-nav-trigger" onClick={() => setIsModalOpen(true)}>
      <MapPin size={18} />
      <span className="addr-nav-text">{displayAddress}</span>
      <ChevronDown size={14} />
      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectAddress={handleSelectAddress}
        currentAddress={displayAddress}
      />
    </div>
  );
};

export default Navbar;
