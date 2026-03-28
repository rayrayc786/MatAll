import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Receipt, 
  FileText, 
  ChevronDown,
  Plus,
  Clock,
  MapPin,
  ArrowRight,
  Mic
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './checkout.css';

// Fix for Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, map.getZoom());
  }, [coords]);
  return null;
};

interface Address {
  _id?: string;
  name: string;
  addressText: string;
  recipientName?: string;
  recipientPhone?: string;
  type: 'Home' | 'Work' | 'Site' | 'Other';
}

const Checkout: React.FC = () => {
  const { cart, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'checkout' | 'address-list' | 'location-ask' | 'map-confirm' | 'address-form'>('checkout');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isSelf, setIsSelf] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false);
  
  // Map States
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
  const [detectedAddr, setDetectedAddr] = useState({ main: 'Detecting...', sub: 'Please wait' });
  const [fullAddress, setFullAddress] = useState('');
  
  // Form States
  const [addressData, setAddressData] = useState({
     nickname: '',
     house: '',
     floor: '',
     tower: '',
     landmark: '',
     directions: '',
     recipientName: '',
     recipientPhone: ''
  });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const itemsTotal = totalAmount;
  const mrpTotal = cart.reduce((acc, item) => acc + (item.product.mrp || item.product.price) * item.quantity, 0);
  const savings = mrpTotal - itemsTotal;
  const deliveryCharge = itemsTotal > 5000 ? 0 : 150;
  const handlingCharge = 25;
  const grandTotal = itemsTotal + deliveryCharge + handlingCharge;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
       toast.error('Please login to proceed to checkout');
       navigate('/login', { state: { from: '/cart' }, replace: true });
       return;
    }

    if (user.jobsites) {
      setAddresses(user.jobsites);
      if (user.jobsites.length > 0) setSelectedAddress(user.jobsites[0]);
    }
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setStep('address-list');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.price,
          selectedVariant: item.selectedVariant
        })),
        totalAmount: grandTotal,
        shippingAddress: selectedAddress.addressText,
        paymentMethod: 'COD'
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressSelection = () => (
    <div className="address-modal-overlay" onClick={() => setStep('checkout')}>
      <div className="address-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select delivery location</h3>
          <button className="close-btn" onClick={() => setStep('checkout')}>×</button>
        </div>
        
        <div className="address-list-container">
          <button className="add-new-addr-btn" onClick={() => setStep('location-ask')}>
            <Plus size={18} /> Add New Address
          </button>
          
          {addresses.map((addr, idx) => (
            <div 
              key={idx} 
              className={`address-item-card ${selectedAddress === addr ? 'selected' : ''}`}
              onClick={() => { setSelectedAddress(addr); setStep('checkout'); }}
            >
              <div className="addr-main">
                <div className="addr-title-row">
                  <strong>{addr.name}</strong>
                  <span className="addr-tag">{addr.type}</span>
                </div>
                <p className="addr-text-full">{addr.addressText}</p>
              </div>
              <div className="addr-radio">
                <div className={`radio-outer ${selectedAddress === addr ? 'checked' : ''}`}>
                  <div className="radio-inner"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLocationAsk = () => (
    <div className="address-modal-overlay">
      <div className="address-modal-content prompt-modal">
        <h3 className="prompt-title">Where shall we deliver?</h3>
        <p className="prompt-sub">This helps us deliver your order quick.</p>
        
        <button className="prompt-btn btn-yellow" onClick={() => setStep('map-confirm')}>
          I am not at the delivery location
        </button>
        <button className="prompt-btn btn-black" onClick={() => setStep('map-confirm')}>
          I am at the delivery location
        </button>
        
        <button className="modal-back-link" onClick={() => setStep('address-list')}>Back</button>
      </div>
    </div>
  );

  const handleMapMove = async (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    try {
      const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const parts = data.display_name.split(',');
      setDetectedAddr({
        main: parts[0] || 'Unknown',
        sub: parts.slice(1, 4).join(', ') || 'Unknown Area'
      });
      setFullAddress(data.display_name);
    } catch (err) {
      console.error('Reverse Geocode failed');
    }
  };

  const MapEventsController = () => {
    useMapEvents({
      dragend: (e) => {
        const center = e.target.getCenter();
        handleMapMove(center.lat, center.lng);
      }
    });
    return null;
  };

  const renderMapConfirm = () => (
    <div className="map-confirm-screen">
      <header className="map-header">
        <button className="icon-btn-plain" onClick={() => setStep('location-ask')}><ArrowLeft size={20} /></button>
        <span>Confirm location on map</span>
        <button className="icon-btn-plain" onClick={() => navigate('/')}><Home size={20} /></button>
      </header>
      <div className="map-placeholder dynamic">
        <MapContainer center={mapCenter} zoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={mapCenter} />
            <MapUpdater coords={mapCenter} />
            <MapEventsController />
        </MapContainer>
        <div className="center-marker-overlay">
           <MapPin size={40} color="#ef4444" fill="#ef4444" />
        </div>
      </div>
      <div className="map-bottom-sheet">
        <div className="detected-addr-box">
          <MapPin size={22} className="yellow-pin" />
          <div className="detected-text">
            <strong>{detectedAddr.main}</strong>
            <p>{detectedAddr.sub}</p>
          </div>
        </div>
        <button className="btn-input-complete" onClick={() => {
           setAddressData({ ...addressData, recipientName: user.fullName || '', recipientPhone: user.phoneNumber || '' });
           setStep('address-form');
        }}>
          Add complete address
        </button>
      </div>
    </div>
  );

  const renderAddressForm = () => (
    <div className="address-form-screen">
      <header className="map-header">
        <button className="icon-btn-plain" onClick={() => setStep('map-confirm')}><ArrowLeft size={20} /></button>
        <span>Add more address details</span>
        <button className="icon-btn-plain" onClick={() => navigate('/')}><Home size={20} /></button>
      </header>
      
      <div className="form-scroll-content">
        <div className="who-ordering-section">
          <p>Who are you ordering for?</p>
          <div className="toggle-row">
            <button className={`toggle-btn ${isSelf ? 'active' : ''}`} onClick={() => {
               setIsSelf(true);
               setAddressData({ ...addressData, recipientName: user.fullName || '', recipientPhone: user.phoneNumber || '' });
            }}>Yourself</button>
            <button className={`toggle-btn ${!isSelf ? 'active' : ''}`} onClick={() => {
               setIsSelf(false);
               setAddressData({ ...addressData, recipientName: '', recipientPhone: '' });
            }}>Someone else</button>
          </div>
        </div>

        <div className="input-group">
          <input 
            type="text" 
            placeholder="Address Nickname (e.g. Home, Site 1)" 
            value={addressData.nickname}
            onChange={(e) => setAddressData({ ...addressData, nickname: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="House/ Unit Number" 
            value={addressData.house}
            onChange={(e) => setAddressData({ ...addressData, house: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Floor" 
            value={addressData.floor}
            onChange={(e) => setAddressData({ ...addressData, floor: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Tower/ Block (optional)" 
            value={addressData.tower}
            onChange={(e) => setAddressData({ ...addressData, tower: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Nearby Landmark" 
            value={addressData.landmark}
            onChange={(e) => setAddressData({ ...addressData, landmark: e.target.value })}
          />
          <div className="textarea-wrapper">
            <textarea 
               placeholder="Any directions. Help rider reach your location"
               value={addressData.directions}
               onChange={(e) => setAddressData({ ...addressData, directions: e.target.value })}
            ></textarea>
            <Mic size={18} className="mic-icon-small" />
          </div>
          {!isSelf && (
            <>
              <input 
                type="text" 
                placeholder="Enter Recipient's name" 
                value={addressData.recipientName}
                onChange={(e) => setAddressData({ ...addressData, recipientName: e.target.value })}
              />
              <input 
                type="tel" 
                placeholder="Recipient's mobile number" 
                value={addressData.recipientPhone}
                onChange={(e) => setAddressData({ ...addressData, recipientPhone: e.target.value })}
              />
            </>
          )}
        </div>

        <button className="btn-input-complete" onClick={() => {
           const finalAddr = {
              name: addressData.nickname || 'Unknown',
              addressText: `${addressData.house ? addressData.house + ', ' : ''}${addressData.floor ? 'Floor ' + addressData.floor + ', ' : ''}${fullAddress}`,
              type: 'Home' as any,
              recipientName: addressData.recipientName,
              recipientPhone: addressData.recipientPhone
           };
           setSelectedAddress(finalAddr);
           setStep('checkout');
           toast.success('Location confirmed!');
        }}>
          Save & Continue
        </button>
      </div>
    </div>
  );

  return (
    <div className="blinkit-checkout-page">
      <header className="checkout-header-sticky">
        <div className="header-nav-container main-content-responsive">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title">Checkout</div>
        </div>
      </header>

      <main className="checkout-content main-content-responsive">
        <div className="checkout-grid-responsive">
          <div className="checkout-left-col">
            {/* Order Owner Details */}
            <div className="checkout-user-pod">
              <div className="pod-icon-circle"><Receipt size={20} /></div>
              <div className="pod-info-stack">
                <p className="pod-label-top">Order for</p>
                <div className="pod-main-text">
                  <strong>{user.fullName || 'Guest'}</strong>
                  <span className="divider-dot">•</span>
                  <span>{user.phoneNumber || '9999999999'}</span>
                </div>
              </div>
              <button className="pod-change-btn" onClick={() => setStep('address-list')}>Change</button>
            </div>

            {/* Delivery Address Pod */}
            <div className="checkout-user-pod" onClick={() => setStep('address-list')}>
               <div className="pod-icon-circle pin-yellow"><MapPin size={20} /></div>
               <div className="pod-info-stack">
                  <p className="pod-label-top">Delivering to <strong>{selectedAddress?.name || 'Home'}</strong></p>
                  <p className="pod-subtext-main">{selectedAddress?.addressText || 'Mattaur, Sector 70, SAS Nagar'}</p>
               </div>
               <button className="pod-change-btn">Change</button>
            </div>

            {/* Delivery Time & Shipment - PRD Page 34 */}
            <div className="delivery-slot-card">
               <div className="slot-header">
                  <Clock size={18} />
                  <span>Delivery in 60 Mins</span>
               </div>
               <p className="slot-sub">Shipment of {cart.length} Item{cart.length > 1 ? 's' : ''}</p>
            </div>

            {/* GSTIN Entry - PRD Page 34 */}
            <div className="gstin-entry-row">
               <div className="gst-icon-box">%</div>
               <div className="gst-text">
                  <span>Add GSTIN</span>
                  <p>Claim input tax credit</p>
               </div>
               <ChevronRight size={20} />
            </div>

            {/* Cancellation Policy - PRD Page 34 */}
            <div className={`policy-expandable ${showPolicy ? 'open' : ''}`}>
              <div className="policy-row" onClick={() => setShowPolicy(!showPolicy)}>
                 <span>Cancellation policy</span>
                 <ChevronDown size={18} className={showPolicy ? 'rotate-180' : ''} />
              </div>
              {showPolicy && (
                <div className="policy-content-details">
                  <p>Orders cannot be cancelled once dispatched. For manufacturing defects, items must be inspected at the time of delivery.</p>
                </div>
              )}
            </div>
          </div>

          <div className="checkout-right-col">
            {/* Bill Details - PRD Page 34 */}
            <section className="checkout-section">
              <div className="section-title-row">
                <Receipt size={18} />
                <h3>Bill Details</h3>
              </div>
              <div className="bill-card">
                <div className="bill-row-checkout">
                  <div className="bill-label">
                    <FileText size={14} /> Items Total
                  </div>
                  <span className="bill-val">₹{itemsTotal}</span>
                </div>
                <div className="bill-row-checkout">
                  <span className="bill-label">Delivery Charge</span>
                  <span className="bill-val">{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="free">FREE</span>}</span>
                </div>
                <div className="bill-row-checkout">
                  <span className="bill-label">Handling Charge</span>
                  <span className="bill-val">₹{handlingCharge}</span>
                </div>
                <div className="bill-row-checkout grand-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-val">₹{grandTotal}</span>
                </div>
              </div>
            </section>

            {/* Total Savings Tile - PRD Page 34 */}
            {savings > 0 && (
              <div className="savings-tile">
                <span className="savings-text">Your total savings</span>
                <span className="savings-amount">₹{savings}</span>
              </div>
            )}

            <div className="desktop-order-actions hide-mobile mt-4">
               <button className="final-place-btn-desktop" onClick={handlePlaceOrder} disabled={loading}>
                  {loading ? 'Processing...' : `Place Order • ₹${grandTotal}`}
               </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="checkout-footer-sticky-final">
        <div className="checkout-pay-bar" onClick={() => navigate('/payment')}>
           <div className="pay-method-lux">
              <span className="dot-blinkit"></span>
              <span>PAY USING <strong>UPI</strong></span>
           </div>
           <ChevronDown size={16} />
        </div>
        <button className="checkout-place-btn" onClick={handlePlaceOrder} disabled={loading}>
           <div className="btn-p-info">
              <span className="p-val">₹{grandTotal}</span>
              <span className="p-lbl">TOTAL</span>
           </div>
           <div className="btn-p-main">
              {loading ? 'Processing...' : 'Place Order'} <ArrowRight size={20} />
           </div>
        </button>
      </footer>

      {/* Address Overlay Flow */}
      {step === 'address-list' && renderAddressSelection()}
      {step === 'location-ask' && renderLocationAsk()}
      {step === 'map-confirm' && renderMapConfirm()}
      {step === 'address-form' && renderAddressForm()}
    </div>
  );
};

export default Checkout;
