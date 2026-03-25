import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  Heart, 
  ChevronRight, 
  ChevronDown, 
  MessageCircle, 
  Star, 
  HelpCircle,
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

  const FAQS = [
    { q: 'When will I get my order?', a: 'Your order is currently being processed and will be delivered within the estimated timeline shown above.' },
    { q: 'Can I change my delivery address?', a: 'Address changes are not permitted once the order is confirmed for security reasons.' },
    { q: 'How do I cancel my order?', a: 'Cancellations are only possible within the first 5 minutes of placing the order.' }
  ];

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

  const renderFAQs = () => (
    <div className="faqs-list-prd animate-fade-in">
      {FAQS.map((faq, idx) => (
        <div key={idx} className="faq-item-prd">
          <div className="faq-q"><strong>{faq.q}</strong></div>
          <p className="faq-a">{faq.a}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="blinkit-tracking-page">
      <header className="tracking-header-sticky">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title">Order Status</div>
        <Link to="/" className="home-btn-link">
          <Home size={24} />
        </Link>
      </header>

      <main className="tracking-content">
        {/* Dynamic Status Display */}
        <div className="order-confirmation-hero">
           <div className="conf-icon-box">
              <Heart size={32} fill="#ef4444" color="#ef4444" />
           </div>
           <h2>{getStatusText(order.status)}</h2>
        </div>

        {/* Order Summary Section - PRD Page 48 */}
        <div className="order-summary-tiles-container">
           {order.items.map((item: any, idx: number) => (
              <div key={idx} className="order-item-tile-prd">
                 <div className="item-img-prd">
                    <img src={item?.product?.imageUrl} alt="" />
                 </div>
                 <div className="item-details-prd">
                    <h4>{item?.product?.brand} {item?.product?.name}</h4>
                    <span className="item-qty-prd">Qty: {item?.quantity}</span>
                    <div className="price-row-prd">
                       <span className="sale-price-prd">₹{item?.price * item?.quantity}</span>
                       <span className="mrp-prd">₹{item?.product?.mrp * item?.quantity}</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        {/* Action Buttons - PRD Page 48 */}
        <div className="tracking-actions-list">
           <div 
             className={`action-btn-row-prd ${activeAction === 'track' ? 'active' : ''}`} 
             onClick={() => setActiveTab(activeAction === 'track' ? 'none' : 'track')}
           >
              <div className="action-label-box">
                 <Package size={20} />
                 <span>Track order</span>
              </div>
              <ChevronDown size={20} className={activeAction === 'track' ? 'rotate-180' : ''} />
           </div>
           {activeAction === 'track' && renderTimeline()}

           <div className="action-btn-row-prd" onClick={() => navigate('/support')}>
              <div className="action-label-box">
                 <MessageCircle size={20} />
                 <span>Need support</span>
              </div>
              <ChevronRight size={20} />
           </div>

           <div 
             className={`action-btn-row-prd ${activeAction === 'feedback' ? 'active' : ''}`}
             onClick={() => setActiveTab(activeAction === 'feedback' ? 'none' : 'feedback')}
           >
              <div className="action-label-box">
                 <Star size={20} />
                 <span>Please help us improve</span>
              </div>
              <ChevronDown size={20} className={activeAction === 'feedback' ? 'rotate-180' : ''} />
           </div>
           {activeAction === 'feedback' && renderFeedback()}

           <div 
             className={`action-btn-row-prd ${activeAction === 'faqs' ? 'active' : ''}`}
             onClick={() => setActiveTab(activeAction === 'faqs' ? 'none' : 'faqs')}
           >
              <div className="action-label-box">
                 <HelpCircle size={20} />
                 <span>FAQs</span>
              </div>
              <ChevronDown size={20} className={activeAction === 'faqs' ? 'rotate-180' : ''} />
           </div>
           {activeAction === 'faqs' && renderFAQs()}
        </div>
      </main>
    </div>
  );
};

export default Tracking;
