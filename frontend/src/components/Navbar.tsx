import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LayoutDashboard, Truck, LogOut, Package, ClipboardList, Heart, Loader2, Menu, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import AISearch from './AISearch';

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
    <header className="navbar">
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="logo">BuildItQuick</Link>
      </div>
      
      <div className="search-container-main">
        <form className="search-bar" onSubmit={handleSearch} style={{ width: '100%', margin: 0 }}>
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search name, SKU, or CSI..." 
            value={searchTerm}
            onChange={onInputChange}
            style={{ width: '100%' }}
          />
          {isSearching ? <Loader2 size={18} className="animate-spin" style={{ marginRight: '10px' }} /> : <AISearch />}
        </form>

        {suggestions.length > 0 && (
          <div className="autocomplete-dropdown card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', padding: '0.5rem', maxHeight: '400px', overflowY: 'auto', zIndex: 2000 }}>
            {suggestions.map(item => (
              <div 
                key={item._id} 
                className="suggestion-item" 
                onClick={() => {
                  setSuggestions([]);
                  setSearchTerm('');
                  navigate(`/products/${item._id}`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
              >
                <img 
                  src={getFullImageUrl(item.imageUrl)} 
                  alt="" 
                  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.brand && `Brand: ${item.brand} | `}
                    {item.sku && `SKU: ${item.sku}`}
                    {item.category && ` | ${item.category}`}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>₹{item.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`nav-actions ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/products" className="nav-link">Materials</Link>
        
        {isLoggedIn && (
          <>
            <Link to="/favorites" className="nav-link" title="Favorites">
              <span className="nav-text-mobile">Favorites</span>
              <Heart size={22} className="nav-icon-desktop" />
            </Link>
            <Link to="/orders" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={18} /> Orders
            </Link>
          </>
        )}
        
        {isLoggedIn && user.role === 'Admin' && (
          <Link to="/admin" className="nav-link admin-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-dark)', fontWeight: 800 }}>
            <LayoutDashboard size={18} /> Admin
          </Link>
        )}
        
        {isLoggedIn && user.role === 'Driver' && (
          <Link to="/driver" className="nav-link driver-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 800 }}>
            <Truck size={18} /> Driver Portal
          </Link>
        )}

        {isLoggedIn && user.role === 'Vendor' && (
          <Link to="/vendor" className="nav-link vendor-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 800 }}>
            <Package size={18} /> Vendor Portal
          </Link>
        )}

        {isLoggedIn ? (
          <>
            <Link to="/profile" className="nav-link user-profile-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={24} /> <span className="nav-text-mobile">Profile</span>
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 700 }}>
              <LogOut size={20} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={24} /> Login
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
