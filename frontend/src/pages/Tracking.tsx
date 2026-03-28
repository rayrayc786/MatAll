import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  ChevronDown, 
  MessageCircle, 
  Star, 
  Package
} from 'lucide-react';
import { customerSocket } from '../socket';
import './tracking.css';

const Tracking: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveTab] = useState<'none' | 'track' | 'feedback' | 'faqs'>('track');
  const [rating, setRating] = useState(5);


  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    customerSocket.on('order-status-update', (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      customerSocket.off('order-status-update');
    };
  }, [id]);

  if (loading) return <div className="loading-box">Checking order status...</div>;
  if (!order) return <div className="loading-box">Order not found</div>;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'Your order is confirmed';
      case 'Out-for-Delivery': return 'Order is out for delivery';
      case 'Delivered': return 'Order delivered successfully';
      default: return 'Processing your order';
    }
  };

  const renderTimeline = () => (
    <div className="tracking-timeline-expanded animate-fade-in">
      <div className="timeline-item active">
          <div className="dot"></div>
          <div className="text">Order Received at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
      <div className={`timeline-item ${['Confirmed', 'Out-for-Delivery', 'Delivered'].includes(order.status) ? 'active' : ''}`}>
          <div className="dot"></div>
          <div className="text">Order Confirmed</div>
      </div>
      <div className={`timeline-item ${['Out-for-Delivery', 'Delivered'].includes(order.status) ? 'active' : ''}`}>
          <div className="dot"></div>
          <div className="text">Order Dispatched</div>
      </div>
      <div className={`timeline-item ${order.status === 'Delivered' ? 'active' : ''}`}>
          <div className="dot"></div>
          <div className="text">Order Delivered</div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="feedback-section-prd animate-fade-in">
      <h3 className="feedback-title">Rate this order experience</h3>
      <div className="star-rating-row">
        {[1,2,3,4,5].map(s => (
          <Star 
            key={s} 
            size={32} 
            fill={s <= rating ? "#facc15" : "transparent"} 
            color={s <= rating ? "#facc15" : "#cbd5e1"}
            onClick={() => setRating(s)}
            className="star-icon"
          />
        ))}
      </div>
      <div className="feedback-form">
        <textarea placeholder="Feedback to improve (Do not include personal details)"></textarea>
        <button className="submit-feedback-btn">Submit Review</button>
      </div>
      
      <div className="social-links-prd">
        <p>Follow us on social</p>
        <div className="social-icons">
           <div className="social-circle">IG</div>
           <div className="social-circle">FB</div>
           <div className="social-circle">X</div>
        </div>
      </div>
    </div>
  );


  return (
    <div className="blinkit-tracking-page">
      <header className="tracking-header-sticky">
        <div className="header-left-group">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </button>
          <div className="header-title">Order Details</div>
        </div>
        <Link to="/" className="home-btn-link">
          <Home size={22} />
        </Link>
      </header>

      <main className="tracking-content full-width-mobile">
        {/* Dynamic Status Display */}
        <div className="order-confirmation-hero">
           <div className="conf-icon-box">
              <Package size={32} color="#16a34a" />
           </div>
           <h2>{getStatusText(order.status)}</h2>
           <span className="order-id-label">Order ID: #{order._id.slice(-8).toUpperCase()}</span>
        </div>

        {/* Shipment Details */}
        <div className="section-container card-style">
           <div className="section-header">
              <h3>Shipment Details</h3>
              <span className="items-count-tag">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</span>
           </div>
           <div className="order-item-list-detailed">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="item-row-detailed">
                   <div className="item-thumb-box">
                      <img src={item?.productId?.imageUrl || item?.product?.imageUrl} alt="" />
                   </div>
                   <div className="item-info-col">
                      <p className="item-name-bold">{item?.productId?.brand} {item?.productId?.name || item?.product?.name}</p>
                      <span className="item-variant-label">{item?.selectedVariant || 'Standard'}</span>
                      <div className="item-price-qty-row">
                         <span className="qty-pill">Qty: {item.quantity}</span>
                         <span className="price-bold">₹{item.unitPrice || item.price || 0}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Bill Summary - Reusing Premium Style */}
        <div className="section-container card-style">
           <div className="section-header"><h3>Bill Summary</h3></div>
           <div className="bill-summary-rows">
              <div className="bill-row">
                 <div className="label-with-icon"><Package size={14} /> <span>Items Total</span></div>
                 <span>₹{order.items.reduce((acc: number, item: any) => acc + ((item.unitPrice || item.price || 0) * item.quantity), 0)}</span>
              </div>
              <div className="bill-row">
                 <div className="label-with-icon"><span>Delivery Charge</span></div>
                 <span className="free-tag">₹150</span>
              </div>
              <div className="bill-row">
                 <div className="label-with-icon"><span>Handling Charge</span></div>
                 <span>₹25</span>
              </div>
              <div className="bill-row grand-total-row">
                 <strong>Grand Total</strong>
                 <strong>₹{order.totalAmount}</strong>
              </div>
              <div className="bill-row-footer">
                 <span className="payment-tag">PAID VIA {order.paymentMethod?.toUpperCase() || 'COD'}</span>
              </div>
           </div>
        </div>

        {/* Delivery Address Details */}
        <div className="section-container card-style">
           <div className="section-header"><h3>Order Information</h3></div>
           <div className="order-info-grid">
              <div className="info-block">
                 <span className="info-label">Placed At</span>
                 <p className="info-value">{new Date(order.createdAt).toLocaleString('en-GB')}</p>
              </div>
              <div className="info-block">
                 <span className="info-label">Delivering to</span>
                 <p className="info-value">{order.shippingAddress || order.deliveryAddress?.name}</p>
              </div>
           </div>
        </div>

        {/* Collapsible Secondary Actions */}
        <div className="tracking-actions-list secondary-list">
           <div 
             className={`action-btn-row-prd ${activeAction === 'track' ? 'active' : ''}`} 
             onClick={() => setActiveTab(activeAction === 'track' ? 'none' : 'track')}
           >
              <div className="action-label-box">
                 <Package size={18} />
                 <span>Detailed Tracking</span>
              </div>
              <ChevronDown size={18} className={activeAction === 'track' ? 'rotate-180 transition-transform' : 'transition-transform'} />
           </div>
           {activeAction === 'track' && renderTimeline()}

           <div className="action-btn-row-prd" onClick={() => navigate('/support')}>
              <div className="action-label-box">
                 <MessageCircle size={18} />
                 <span>Need support</span>
              </div>
              <ChevronRight size={18} />
           </div>

           <div 
             className={`action-btn-row-prd ${activeAction === 'feedback' ? 'active' : ''}`}
             onClick={() => setActiveTab(activeAction === 'feedback' ? 'none' : 'feedback')}
           >
              <div className="action-label-box">
                 <Star size={18} />
                 <span>Help us improve</span>
              </div>
              <ChevronDown size={18} className={activeAction === 'feedback' ? 'rotate-180 transition-transform' : 'transition-transform'} />
           </div>
           {activeAction === 'feedback' && renderFeedback()}
        </div>
      </main>
    </div>
  );
};

export default Tracking;
