import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, CreditCard, Landmark, Truck, Banknote, CheckCircle2, ArrowRight, ClipboardList, Edit3, Search, Loader2, Navigation } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoginModal from '../components/LoginModal';

// Component to handle map clicks
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (latlng: any) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Component to fly map to new position
const ChangeMapView = ({ coords }: { coords: any }) => {
  const map = useMap();
  map.flyTo([coords.lat, coords.lng], 15);
  return null;
};

const Checkout: React.FC = () => {
  const { cart, totalAmount, totalWeight, totalVolume, vehicleClass, clearCart } = useCart();
  const [jobsitePos, setJobsitePos] = useState<any>({ lat: 12.9716, lng: 77.5946 });
  const [jobsiteAddress, setJobsiteAddress] = useState('Bangalore Construction Site, Block B');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef<any>(null);

  const navigate = useNavigate();

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const newPos = { lat: latitude, lng: longitude };
      setJobsitePos(newPos);
      
      // Reverse geocode to get address name
      try {
        const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const addr = data.display_name || `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setJobsiteAddress(addr);
        setSearchTerm(addr);
      } catch (err) {
        console.error('Reverse geocoding failed:', err);
      } finally {
        setIsLocating(false);
      }
    }, (err) => {
      console.error(err);
      toast.error('Failed to get your location. Please check browser permissions.');
      setIsLocating(false);
    }, { enableHighAccuracy: true });
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&limit=5`);
      setSuggestions(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJobsiteAddress(value);
    setSearchTerm(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchLocation(value), 500);
  };

  const selectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lon = parseFloat(s.lon);
    setJobsitePos({ lat, lng: lon });
    setJobsiteAddress(s.display_name);
    setSearchTerm(s.display_name);
    setSuggestions([]);
  };

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to place your order');
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const vendorId = cart[0]?.product.vendorId || '65f1a2b3c4d5e6f7a8b9c0d1';
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const orderData = {
        userId: user._id,
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalWeight: (item.product.weightPerUnit || 0) * item.quantity,
          totalVolume: (item.product.volumePerUnit || 0) * item.quantity
        })),
        totalAmount,
        totalWeight,
        totalVolume,
        vehicleClass,
        paymentMethod,
        vendorId,
        darkStoreId: '65f1a2b3c4d5e6f7a8b9c0d2',
        deliveryAddress: {
          name: jobsiteAddress,
          location: {
            type: "Point",
            coordinates: [jobsitePos.lng, jobsitePos.lat]
          }
        }
      };
      
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/checkout`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      clearCart();
      setOrderSuccess(data);
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (orderSuccess) {
    return (
      <main className="content order-success-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <CheckCircle2 size={48} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Order Confirmed!</h1>
          <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Your order #BID-{orderSuccess._id.slice(-6).toUpperCase()} has been placed.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => navigate(`/tracking/${orderSuccess._id}`)} className="btn-primary-lg" style={{ width: '100%', justifyContent: 'center' }}>
              Track Live Delivery <Truck size={20} />
            </button>
            <Link to="/orders" className="secondary-btn" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              <ClipboardList size={20} /> Manage My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="content checkout-page">
      <h1>Jobsite Delivery & Payment</h1>
      
      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        <section className="map-section card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}><MapPin size={20} /> Pin Exact Delivery Location</h3>
          </header>
          
          <div className="address-input-box" style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Delivery Address / Site Name</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                value={jobsiteAddress} 
                onChange={handleSearchChange}
                placeholder="Search for jobsite or enter manually..."
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '2px solid #f1f5f9', fontSize: '1rem', fontWeight: 600 }}
              />
              {(isSearching || isLocating) && <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />}
            </div>

            {suggestions.length > 0 && (
              <div className="search-suggestions card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000, marginTop: '5px', padding: '0.5rem' }}>
                {suggestions.map((s, idx) => (
                  <div key={idx} onClick={() => selectSuggestion(s)} style={{ padding: '10px', cursor: 'pointer', borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '0.9rem' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '8px' }} /> {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="map-wrapper" style={{ position: 'relative' }}>
            <MapContainer center={[jobsitePos.lat, jobsitePos.lng]} zoom={13} style={{ height: '350px', width: '100%', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={jobsitePos} />
              <LocationPicker onLocationSelect={(latlng) => setJobsitePos(latlng)} />
              <ChangeMapView coords={jobsitePos} />
            </MapContainer>
            
            <button 
              onClick={handleLocateMe}
              title="Locate Me"
              style={{ 
                position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000,
                background: 'white', border: 'none', padding: '10px', borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)'
              }}
            >
              {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
            </button>
          </div>
        </section>

        <section className="payment-logistics-section">
          <div className="payment-options card">
            <h3>Select Payment Method</h3>
            <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1.5rem' }}>
              <div className={`payment-method-card ${paymentMethod === 'COD' ? 'active' : ''}`} 
                   onClick={() => setPaymentMethod('COD')}
                   style={{ border: paymentMethod === 'COD' ? '2px solid var(--primary)' : '1px solid #e2e8f0', padding: '1.25rem 1rem', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fffbeb' : 'white' }}>
                <Banknote size={24} style={{ marginBottom: '8px', color: paymentMethod === 'COD' ? 'var(--primary-dark)' : '#94a3b8' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>COD</div>
              </div>
              <div className={`payment-method-card ${paymentMethod === 'upi' ? 'active' : ''}`} 
                   onClick={() => setPaymentMethod('upi')}
                   style={{ border: paymentMethod === 'upi' ? '2px solid var(--primary)' : '1px solid #e2e8f0', padding: '1.25rem 1rem', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', background: paymentMethod === 'upi' ? '#fffbeb' : 'white' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>UPI</div>
              </div>
            </div>
          </div>

          <div className="logistics-card card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Logistics Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px', color: '#2563eb' }}><MapPin size={20} /></div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Delivery To</span>
                  <p style={{ fontWeight: 800, margin: '2px 0 0 0', fontSize: '0.9rem', lineHeight: 1.4 }}>{jobsiteAddress}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {jobsitePos.lat.toFixed(4)}, {jobsitePos.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '10px', color: '#d97706' }}><Truck size={20} /></div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vehicle Fleet</span>
                  <p style={{ fontWeight: 800, margin: '2px 0 0 0', fontSize: '0.9rem' }}>{vehicleClass}</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            className="btn-primary-lg" 
            onClick={handlePlaceOrder}
            style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', justifyContent: 'center' }}
          >
            Confirm Order - ₹{totalAmount.toFixed(2)}
          </button>
        </section>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={() => handlePlaceOrder()} 
      />
    </main>
  );
};

export default Checkout;
