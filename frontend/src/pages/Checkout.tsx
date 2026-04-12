import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin,
  Clock,
  ArrowLeft,
  ChevronDown,
  Receipt,
  ShoppingBasket
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLocationContext } from '../contexts/LocationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LocationModal from '../components/LocationModal';
import './checkout.css';
import SEO from '../components/SEO';
// import { getFullImageUrl } from '../utils/imageUrl';

interface Address {
  _id?: string;
  name: string;
  addressText: string;
  recipientName?: string;
  recipientPhone?: string;
  type: 'Home' | 'Work' | 'Site' | 'Other';
}

const Checkout: React.FC = () => {
  
  const { cart, clearCart, totalAmount, totalGst, totalWeight: cartWeight, totalVolume: cartVolume, maxLogisticsCategory } = useCart();
  const { settings } = useSettings();
  const { location: globalLocation, setLocation: setGlobalLocation } = useLocationContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  const [showPolicy, setShowPolicy] = useState(false);
  const [showSplitPopup, setShowSplitPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logisticsInfo = settings.logisticsRates[maxLogisticsCategory as keyof typeof settings.logisticsRates] || settings.logisticsRates.light;

  const itemsTotal = totalAmount;
  const mrpTotal = cart.reduce((acc, item) => acc + (item.product.mrp || item.product.price) * item.quantity, 0);
  const savings = mrpTotal - itemsTotal;
  const deliveryCharge = itemsTotal > settings.freeDeliveryThreshold ? 0 : logisticsInfo.rate;
  const deliveryMode = logisticsInfo.mode;
  const handlingCharge = settings.platformFee;
  const grandTotal = itemsTotal + deliveryCharge + handlingCharge;
  // const appliedGstRates = Array.from(new Set(cart.map(item => {
  //   let rate = (item.product as any).gst || 18;
  //   if (item.selectedVariant && item.product.variants) {
  //     const variant: any = item.product.variants.find(v => v.name === item.selectedVariant);
  //     if (variant) {
  //       rate = variant.pricing?.gst || (item.product as any).gst || 18;
  //     }
  //   }
  //   return rate;
  // }))).sort((a, b) => b - a);

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
      
      // Recognition logic: match global location with a saved jobsite
      if (globalLocation) {
        if (globalLocation.matchingJobsite) {
             setSelectedAddress(globalLocation.matchingJobsite);
        } else {
             // If no saved match, we DON'T auto-select. Force user to add site.
             setSelectedAddress(null);
        }
      } else if (user.jobsites.length > 0) {
        setSelectedAddress(user.jobsites[0]);
      }
    }
  }, [globalLocation]);


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
    if (!settings.isServiceEnabled || (globalLocation && !globalLocation.isServiceable)) {
      toast.error(settings.offlineMessage || "Service is currently unavailable in this location.");
      return;
    }

    if (!selectedAddress) {
      toast.error('Please add or select a delivery address to proceed.');
      setIsLocationModalOpen(true);
      return;
    }

    const hasOnDemand = cart.some(item => item.product.deliveryTime === 'On Demand');
    if (hasOnDemand) {
      toast.error('Some items in your cart are only available on demand. Please remove them to proceed with online buying.');
      return;
    }

    if (mode === 'partial') {
      setCountdown(5);
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

    const payAmount = mode === 'partial' ? Math.round(grandTotal * (settings.partPaymentPercentage / 100)) : grandTotal;

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
        description: mode === 'partial' ? `Advance Payment (${settings.partPaymentPercentage}%)` : 'Full Payment',
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
             await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/razorpay/verify`, {
               razorpay_order_id: response.razorpay_order_id,
               razorpay_payment_id: response.razorpay_payment_id,
               razorpay_signature: response.razorpay_signature
             }, { headers: { Authorization: `Bearer ${token}` } });
             
              toast.success('Payment Verified!');
             const finalPaymentMethod = mode === 'partial' ? `Partial Payment (${settings.partPaymentPercentage}%)` : 'Online Payment';
             
             await finalizeOrder(
               finalPaymentMethod, 
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
          contact: user.phoneNumber || ''
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
      } else if (err.response && err.response.status === 403) {
        toast.error(err.response.data.message || "We're offline to make sure you experience is 10/10 tomorrow.See you at 9:00 AM!");
      } else {
        toast.error('Could not create payment session.');
      }
    } finally {
      setLoading(false);
    }
  };

  const finalizeOrder = async (paymentMethod: string, paymentRef: string | null, paidAmount: number) => {
    const hasOnDemand = cart.some(item => item.product.deliveryTime === 'On Demand');
    if (hasOnDemand) {
      toast.error('Some items in your cart are only available on demand. Please remove them to proceed.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address first');
      setIsLocationModalOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map(item => {
          const variant = item.product.variants?.find((v: any) => v.name === item.selectedVariant);
          const rawWeight = variant?.inventory?.unitWeight || (variant as any)?.unitWeightGm || item.product.weightPerUnit || 0;
          const iWeightKg = rawWeight / 1000;
          return {
            productId: item.product._id,
            quantity: item.quantity,
            price: variant?.pricing?.salePrice || item.product.salePrice || item.product.price || 0,
            taxRate: variant?.pricing?.gst || (item.product as any).gst || (item.product.variants?.[0]?.pricing?.gst) || 18,
            selectedVariant: item.selectedVariant,
            totalWeight: iWeightKg * item.quantity,
            totalVolume: (item.product.volumePerUnit || 0) * item.quantity
          };
        }),
        totalAmount: grandTotal,
        totalTaxAmount: totalGst,
        totalBaseAmount: totalAmount - totalGst,
        totalWeight: cartWeight,
        totalVolume: cartVolume,
        paidAmount: paidAmount,
        paymentMethod: paymentMethod,
        paymentReference: paymentRef,
        deliveryAddress: {
          name: selectedAddress.name || 'Site',
          fullAddress: selectedAddress.addressText || 'N/A',
          contactPhone: (selectedAddress as any).contactPhone || '',
          pincode: (selectedAddress as any).pincode || '',
          city: (selectedAddress as any).city || '',
          state: (selectedAddress as any).state || '',
          country: (selectedAddress as any).country || 'India',
          location: (selectedAddress as any).location || { type: 'Point', coordinates: [0, 0] }
        }
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
      } else if (err.response && (err.response.status === 403)) {
          toast.error(err.response.data.message || "We're offline to make sure you experience is 10/10 tomorrow.See you at 9:00 AM!");
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

  const handleAddressSelect = (addressText: string) => {
    // Refresh user data to get the latest addresses
    const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (updatedUser.jobsites) {
      setAddresses(updatedUser.jobsites);
      
      // Find the site that matches this addressText or coordinate
      const match = updatedUser.jobsites.find((s: any) => s.addressText === addressText);
      if (match) {
        setSelectedAddress(match);
        setGlobalLocation({
          address: match.addressText,
          coords: { lat: match.location.coordinates[1], lng: match.location.coordinates[0] },
          isServiceable: true,
          matchingJobsite: match
        }, true);
      }
    }
  };


  return (
    <div className="matall-checkout-page">
      <SEO title="Secure Checkout" description="Finalize your order on MatAll. Secure payment and fast delivery for all your building material needs." />
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
          <section className="checkout-section">

          <div className="checkout-left-col">
            <div className="section-title-row">
                <ShoppingBasket size={18} />
                <h3>Checkout Summary</h3>
            </div>
            <div className="delivery-slot-card">
               <div className="slot-header">
                  <Clock size={18} />
                  <span>Delivery in 60 Mins</span>
               </div>
               <p className="slot-sub">Shipment of {cart.length} Item{cart.length > 1 ? 's' : ''}</p>
            </div>

            <div className="checkout-user-pod" onClick={() => setIsLocationModalOpen(true)}>
              <div className="pod-icon-circle"><Receipt size={20} /></div>
              <div className="pod-info-stack">
                <p className="pod-label-top">Order for</p>
                <div className="pod-main-text">
                  <strong>{user.fullName || 'Guest'}</strong>
                  <span>{user.phoneNumber || ''}</span>
                </div>
              </div>
              <button className="pod-change-btn">Change</button>
            </div>
            <div className="checkout-user-pod" onClick={() => setIsLocationModalOpen(true)}>
               <div className="pod-icon-circle pin-yellow"><MapPin size={20} /></div>
               <div className="pod-info-stack">
                  <p className="pod-label-top">Delivering to <strong>{selectedAddress?.name || 'Home'}</strong></p>
                  <p className="pod-subtext-main">{selectedAddress?.addressText || 'Select Delivery Location'}</p>
               </div>
               <button className="pod-change-btn">Change</button>
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
          </section>

          <div className="checkout-right-col">
            <section className="checkout-section">
              <div className="section-title-row">
                <Receipt size={18} />
                <h3>Bill Summary</h3>
              </div>
              <div className="bill-card">
                <div className="bill-row-checkout">
                  <span>Item Total (Excl. GST)</span>
                  <span className="bill-val">₹{(totalAmount - totalGst).toFixed(2)}</span>
                </div>
                <div className="bill-row-checkout bill-row-secondary">
                  <span>GST Amount </span>
                  <span className="bill-val">₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="bill-row-checkout">
                  <div className="bill-label-group">
                    <span>Delivery Charge (incl GST)</span>
                    <span className="delivery-mode-tag">(Mode: {deliveryMode})</span>
                  </div>
                  <span className="bill-val">{deliveryCharge > 0 ? `₹${deliveryCharge.toFixed(2)}` : <span className="free">FREE</span>}</span>
                </div>
                <div className="bill-row-checkout">
                  <span>Handling Charge</span>
                  <span className="bill-val">₹{handlingCharge.toFixed(2)}</span>
                </div>

                <div className="bill-row-checkout grand-total-row">
                  <span className="total-label">Grand Total</span>
                  <span className="total-val">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {savings > 0 && (
              <div className="savings-tile">
                <span className="savings-text">Your total savings</span>
                <span className="savings-amount">₹{savings.toFixed(2)}</span>
              </div>
            )}

             <div className="desktop-order-actions mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!settings.isServiceEnabled && (
                  <div className="offline-warning-card" style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '15px', borderRadius: '12px', marginBottom: '15px', color: '#991b1b', fontSize: '0.9rem', fontWeight: '600', textAlign: 'center' }}>
                    ⚠️ {settings.offlineMessage}
                  </div>
                )}
                
                {settings.isFullPaymentEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('full')} disabled={loading || !settings.isServiceEnabled}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Pay online - Full 100% now • ₹${grandTotal.toFixed(2)}`}
                  </button>
                )}

                {settings.isPartPaymentEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('partial')} disabled={loading || !settings.isServiceEnabled} style={{ background: !settings.isServiceEnabled ? '#f1f5f9' : '#DEDEDE', color: '#000' }}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Split Payment – ${settings.partPaymentPercentage}% now and ${100 - settings.partPaymentPercentage}% on delivery • ₹${Math.round(grandTotal * (settings.partPaymentPercentage / 100)).toFixed(2)}`}
                  </button>
                )}

                {settings.isCodEnabled && (
                  <button className={`final-place-btn-desktop ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => finalizeOrder('COD', null, 0)} disabled={loading || !settings.isServiceEnabled} style={{ background: '#000', color: '#FFEA00' }}>
                      {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Service Offline' : `Cash on Delivery (COD) – Pay ₹${grandTotal.toFixed(2)} at home`}
                  </button>
                )}
             </div>
          </div>
        </div>
      </main>

      <footer className="checkout-footer-sticky-final">
        <div className="footer-action-buttons-mobile">
          {settings.isFullPaymentEnabled && (
            <button className={`checkout-place-btn full-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('full')} disabled={loading || !settings.isServiceEnabled}>
              <div className="btn-p-info">
                  <span className="p-val">₹{grandTotal.toFixed(2)}</span>
                  <span className="p-lbl">100% NOW</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'Pay Online'}
              </div>
            </button>
          )}
          
          {settings.isPartPaymentEnabled && (
            <button className={`checkout-place-btn partial-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => handlePlaceOrder('partial')} disabled={loading || !settings.isServiceEnabled}>
              <div className="btn-p-info">
                  <span className="p-val">₹{Math.round(grandTotal * (settings.partPaymentPercentage / 100)).toFixed(2)}</span>
                  <span className="p-lbl">{settings.partPaymentPercentage}% SPLIT</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'Split Payment'}
              </div>
            </button>
          )}

          {settings.isCodEnabled && (
            <button className={`checkout-place-btn cod-pay ${!settings.isServiceEnabled ? 'disabled' : ''}`} onClick={() => finalizeOrder('COD', null, 0)} disabled={loading || !settings.isServiceEnabled} style={{ background: '#000', color: '#fff' }}>
              <div className="btn-p-info">
                  <span className="p-val">₹{grandTotal.toFixed(2)}</span>
                  <span className="p-lbl">ON DELIVERY</span>
              </div>
              <div className="btn-p-main">
                  {loading ? 'Processing...' : !settings.isServiceEnabled ? 'Offline' : 'COD'}
              </div>
            </button>
          )}
        </div>
      </footer>

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setInitialData(null);
          setEditIndex(null);
        }}
        onSelectAddress={handleAddressSelect}
        currentAddress={selectedAddress?.addressText}
        initialData={initialData}
        editIndex={editIndex}
      />
      {showSplitPopup && renderSplitPopup()}
    </div>
  );
};


export default Checkout;
