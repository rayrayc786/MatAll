import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Receipt, 
  ChevronDown,
  Plus,
  Clock,
  MapPin,
  Mic,
  Navigation
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Map, AdvancedMarker, useApiIsLoaded, useMapsLibrary } from '@vis.gl/react-google-maps';
import './checkout.css';

interface Address {
  _id?: string;
  name: string;
  addressText: string;
  recipientName?: string;
  recipientPhone?: string;
  type: 'Home' | 'Work' | 'Site' | 'Other';
}

const Checkout: React.FC = () => {
  const isLoaded = useApiIsLoaded();
  const geocodingLibrary = useMapsLibrary('geocoding');
  
  const { cart, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'checkout' | 'address-list' | 'location-ask' | 'map-confirm' | 'address-form'>('checkout');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  
  // Map/Address states
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [detectedAddr, setDetectedAddr] = useState({ main: 'Detecting...', sub: 'Please wait' });
  const [fullAddress, setFullAddress] = useState('');
  const [isServiceable, setIsServiceable] = useState(true);

  
  // Form States
  const [isSelf, setIsSelf] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [, setPendingMode] = useState<'full' | 'partial' | null>(null);

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
    let timer: any;
    if (showSplitPopup && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (showSplitPopup && countdown === 0) {
      setShowSplitPopup(false);
      startPaymentProcess('partial');
    }
    return () => clearInterval(timer);
  }, [showSplitPopup, countdown]);

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = (mode: 'full' | 'partial') => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setStep('address-list');
      return;
    }

    if (mode === 'partial') {
      setCountdown(5);
      setPendingMode('partial');
      setShowSplitPopup(true);
    } else {
      startPaymentProcess('full');
    }
  };

  const startPaymentProcess = async (mode: 'full' | 'partial') => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Check connection.');
      setLoading(false);
      return;
    }

    const payAmount = mode === 'partial' ? Math.round(grandTotal / 2) : grandTotal;

    try {
      const { data: orderData } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/razorpay/create-order`, {
        amount: payAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock12345',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MatAll',
        description: mode === 'partial' ? 'Advance Payment (50%)' : 'Full Payment',
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
             await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/razorpay/verify`, {
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             }, { headers: { Authorization: `Bearer ${token}` } });
             
             toast.success('Payment Verified!');
             await finalizeOrder(
               mode === 'partial' ? 'Partial Payment (50%)' : 'Online Payment', 
               response.razorpay_payment_id,
               payAmount
             );
          } catch (err) {
             toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user.fullName || 'Guest',
          email: user.email || 'customer@example.com',
          contact: user.phoneNumber || '9999999999'
        },
        theme: {
          color: '#FFEA00'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
           toast.error(response.error.description);
      });
      paymentObject.open();

    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login', { state: { from: '/cart' }, replace: true });
      } else {
        toast.error('Could not create payment session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const finalizeOrder = async (paymentMethod: string, paymentRef: string | null, paidAmount: number) => {
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
        paidAmount: paidAmount,
        shippingAddress: selectedAddress?.addressText || 'Unknown',
        paymentMethod: paymentMethod,
        paymentReference: paymentRef
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login', { state: { from: '/cart' }, replace: true });
      } else {
          toast.error('Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSplitPopup = () => (
    <div className="split-policy-popup-overlay">
       <div className="split-policy-popup-content">
          <div className="popup-timer-circle">{countdown}</div>
          <h3 className="popup-title">Split Payment Terms</h3>
          <p className="popup-text">
            if the item is not received at delivery for any reason apart from defective/ broken product, the refund will be made after adjusting for delivery charges shown at time of placing order.
          </p>
          <div className="popup-footer-text">Redirecting to payment gateway...</div>
       </div>
    </div>
  );

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

  const checkPincode = async (results: any) => {
    const addressComponents = results[0].address_components;
    const pincodeComp = addressComponents.find((c: any) => c.types.includes('postal_code'));
    const pincode = pincodeComp ? pincodeComp.long_name : '';

    if (!pincode) {
      toast.error("Could not detect pincode. Please try another spot.");
      return false;
    }

    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/check-serviceability/${pincode}`);
      if (!data.serviceable) {
        toast.error(`Sorry, we don't serve in ${pincode} yet. We currently serve in ${data.city || 'limited areas'}.`, {
          duration: 4000,
          icon: '📍'
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error('Serviceability check failed', err);
      return true; 
    }
  };

  const handleMapMoveEnd = (e: any) => {

    const center = e.detail.center;
    if (!center) return;
    const lat = center.lat;
    const lng = center.lng;
    setMapCenter({ lat, lng });
    
    if (geocodingLibrary) {
      const geocoder = new geocodingLibrary.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
        if (status === "OK" && results?.[0]) {
          const isServiceable = await checkPincode(results);
          const address = results[0].formatted_address;
          const parts = address.split(',');
          
          if (!isServiceable) {
            setDetectedAddr({
              main: 'Location Not Serviceable',
              sub: 'We currently do not serve in this area'
            });
            setFullAddress('');
            setIsServiceable(false);
            return;
          }

          setDetectedAddr({
            main: parts[0] || 'Unknown',
            sub: parts.slice(1, 4).join(', ') || 'Unknown Area'
          });
          setFullAddress(address);
          setIsServiceable(true);

        }
      });
    }


  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Detecting location...', { id: 'geo-toast' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          
          if (geocodingLibrary) {
            const geocoder = new geocodingLibrary.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
              if (status === "OK" && results?.[0]) {
                const isServiceable = await checkPincode(results);
                toast.dismiss('geo-toast');
                
                const address = results[0].formatted_address;
                const parts = address.split(',');

                if (!isServiceable) {
                  setDetectedAddr({
                    main: 'Location Not Serviceable',
                    sub: 'We currently do not serve in this area'
                  });
                  setFullAddress('');
                  setIsServiceable(false);
                  return;
                }

                setDetectedAddr({
                  main: parts[0] || 'Unknown',
                  sub: parts.slice(1, 4).join(', ') || 'Unknown Area'
                });
                setFullAddress(address);
                setIsServiceable(true);

                toast.success('Location found!', { id: 'geo-toast' });
              }
            });
          }


        },
        (error) => {
          toast.error('Could not get your location', { id: 'geo-toast' });
          console.error('Geo error', error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const renderMapConfirm = () => (
    <div className="map-confirm-screen">
      <header className="map-header">
        <button className="icon-btn-plain" onClick={() => setStep('location-ask')}><ArrowLeft size={20} /></button>
        <span>Confirm location on map</span>
        <button className="icon-btn-plain" onClick={() => navigate('/')}><Home size={20} /></button>
      </header>
      <div className="map-placeholder dynamic">
        {isLoaded ? (
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={mapCenter}
            defaultZoom={16}
            onCameraChanged={handleMapMoveEnd}
            mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
            disableDefaultUI={true}
            gestureHandling={'greedy'}
          >
            <AdvancedMarker position={mapCenter} />
          </Map>
        ) : (
          <div className="map-loading">Loading Maps...</div>
        )}
        <div className="center-marker-overlay">
           <MapPin size={40} color="#ef4444" fill="#ef4444" />
        </div>
        <button className="locate-me-fab" onClick={handleUseCurrentLocation} aria-label="Use Current Location">
           <Navigation size={22} color="#1e293b" fill="#1e293b" />
        </button>
      </div>
      <div className="map-bottom-sheet">
        <div className="detected-addr-box">
          <MapPin size={22} className="yellow-pin" />
          <div className="detected-text">
            <strong>{detectedAddr.main}</strong>
            <p>{detectedAddr.sub}</p>
          </div>
        </div>
        <button 
           className="btn-input-complete" 
           disabled={!isServiceable || !fullAddress}
           style={{ opacity: (!isServiceable || !fullAddress) ? 0.5 : 1, cursor: (!isServiceable || !fullAddress) ? 'not-allowed' : 'pointer' }}
           onClick={() => {
              setAddressData({ ...addressData, recipientName: user.fullName || '', recipientPhone: user.phoneNumber || '' });
              setStep('address-form');
           }}
        >
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
            <div className="delivery-slot-card">
               <div className="slot-header">
                  <Clock size={18} />
                  <span>Delivery in 60 Mins</span>
               </div>
               <p className="slot-sub">Shipment of {cart.length} Item{cart.length > 1 ? 's' : ''}</p>
            </div>
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

            <div className="checkout-user-pod" onClick={() => setStep('address-list')}>
               <div className="pod-icon-circle pin-yellow"><MapPin size={20} /></div>
               <div className="pod-info-stack">
                  <p className="pod-label-top">Delivering to <strong>{selectedAddress?.name || 'Home'}</strong></p>
                  <p className="pod-subtext-main">{selectedAddress?.addressText || 'Mattaur, Sector 70, SAS Nagar'}</p>
               </div>
               <button className="pod-change-btn">Change</button>
            </div>

            <div className="gstin-entry-row">
               <div className="gst-icon-box">%</div>
               <div className="gst-text">
                  <span>Add GSTIN</span>
                  <p>Claim input tax credit</p>
               </div>
               <ChevronRight size={20} />
            </div>

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
            <section className="checkout-section">
              <div className="section-title-row">
                <Receipt size={18} />
                <h3>Bill Summary</h3>
              </div>
              <div className="bill-card">
                <div className="bill-row-checkout">
                  <span>Item Total</span>
                  <span className="bill-val">₹{itemsTotal}</span>
                </div>
                <div className="bill-row-checkout">
                  <span>Delivery Charge</span>
                  <span className="bill-val">{deliveryCharge > 0 ? `₹${deliveryCharge}` : <span className="free">FREE</span>}</span>
                </div>
                <div className="bill-row-checkout">
                  <span>Handling Charge</span>
                  <span className="bill-val">₹{handlingCharge}</span>
                </div>
                <div className="bill-row-checkout grand-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-val">₹{grandTotal}</span>
                </div>
              </div>
            </section>

            {savings > 0 && (
              <div className="savings-tile">
                <span className="savings-text">Your total savings</span>
                <span className="savings-amount">₹{savings}</span>
              </div>
            )}

            <div className="desktop-order-actions mt-4">
               <button className="final-place-btn-desktop" onClick={() => handlePlaceOrder('full')} disabled={loading}>
                  {loading ? 'Processing...' : `Pay online - Full 100% now • ₹${grandTotal}`}
               </button>
               <button className="final-place-btn-desktop" onClick={() => handlePlaceOrder('partial')} disabled={loading} style={{marginTop: '10px', background: '#DEDEDE', color: '#000'}}>
                  {loading ? 'Processing...' : `Split Payment – 50% now and 50% on order delivery • ₹${Math.round(grandTotal / 2)}`}
               </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="checkout-footer-sticky-final">
        {/* <div className="checkout-pay-bar" onClick={() => navigate('/payment')}>
           <div className="pay-method-lux">
              <span className="dot-blinkit"></span>
              <span>PAY USING <strong>UPI</strong></span>
           </div>
           <ChevronDown size={16} />
        </div> */}
        <div className="footer-action-buttons-mobile">
          <button className="checkout-place-btn full-pay" onClick={() => handlePlaceOrder('full')} disabled={loading}>
             <div className="btn-p-info">
                <span className="p-val">₹{grandTotal}</span>
                <span className="p-lbl">100% NOW</span>
             </div>
             <div className="btn-p-main">
                {loading ? 'Processing...' : 'Pay Online'}
             </div>
          </button>
          
          <button className="checkout-place-btn partial-pay" onClick={() => handlePlaceOrder('partial')} disabled={loading}>
             <div className="btn-p-info">
                <span className="p-val">₹{Math.round(grandTotal / 2)}</span>
                <span className="p-lbl">50% SPLIT</span>
             </div>
             <div className="btn-p-main">
                {loading ? 'Processing...' : 'Split Payment'}
             </div>
          </button>
        </div>
      </footer>

      {step === 'address-list' && renderAddressSelection()}
      {step === 'location-ask' && renderLocationAsk()}
      {step === 'map-confirm' && renderMapConfirm()}
      {step === 'address-form' && renderAddressForm()}
      {showSplitPopup && renderSplitPopup()}
    </div>
  );
};


export default Checkout;
