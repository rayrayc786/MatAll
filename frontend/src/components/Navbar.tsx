import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LayoutDashboard, Truck, LogOut, Package, ClipboardList, Heart, Loader2, Menu, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import AISearch from './AISearch';
import LocationSelector from './LocationSelector';
import './navbar.css';

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchTimeout = useRef<any>(null);
  
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const isHomePage = location.pathname === '/';
  const isProductListPage = location.pathname === '/products';

  useEffect(() => {
    setSuggestions([]); // Clear on route change
    setIsMenuOpen(false); // Close menu on route change
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSuggestions([]);
      navigate(`/products?search=${searchTerm}`);
    }
  };

  const getAutocomplete = async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/autocomplete?q=${q}`);
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => getAutocomplete(value), 300);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  return (
    <header className={`navbar ${isHomePage ? 'home-navbar' : ''}`}>
      <div className="nav-left">
        <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="logo">BuildItQuick</Link>
      </div>
      
      {!isProductListPage && (
        <div className="search-container-main">
          {isHomePage && <div className="mobile-location-header"><LocationSelector /></div>}
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder='Search "cement"' 
              value={searchTerm}
              onChange={onInputChange}
            />
            {isSearching ? <Loader2 size={18} className="animate-spin suggestion-loader" /> : <AISearch />}
          </form>

          {suggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {suggestions.map(item => (
                <div 
                  key={item._id} 
                  className="suggestion-item" 
                  onClick={() => {
                    setSuggestions([]);
                    setSearchTerm('');
                    navigate(`/products/${item._id}`);
                  }}
                >
                  <img 
                    src={getFullImageUrl(item.imageUrl)} 
                    alt="" 
                    className="suggestion-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
                    }}
                  />
                  <div className="suggestion-info">
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-meta">
                      {item.brand && `Brand: ${item.brand} | `}
                      {item.sku && `SKU: ${item.sku}`}
                      {item.category && ` | ${item.category}`}
                    </div>
                  </div>
                  <div className="suggestion-price">₹{item.price}</div>
                </div>
              ))}
            </div>
          )}
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
    </header>
  );
};

export default Navbar;
