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
import { getFullImageUrl } from '../utils/imageUrl';
import { customerSocket } from '../socket';
import './tracking.css';
import SEO from '../components/SEO';

const Tracking: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveTab] = useState<'none' | 'track' | 'feedback' | 'faqs'>('track');
  const [reviewState, setReviewState] = useState<{ [productId: string]: { rating: number, comment: string, isOpen: boolean, isSubmitting: boolean, submitted: boolean } }>({});

  const toggleReviewForm = (productId: string) => {
    setReviewState(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        isOpen: !prev[productId]?.isOpen,
        rating: prev[productId]?.rating || 5,
        comment: prev[productId]?.comment || ''
      }
    }));
  };

  const submitProductReview = async (productId: string) => {
    const currentReview = reviewState[productId];
    if (!currentReview || !currentReview.comment.trim()) return;
    
    try {
      setReviewState(prev => ({
        ...prev,
        [productId]: { ...prev[productId], isSubmitting: true }
      }));
      
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/reviews`, {
        productId,
        orderId: id,
        rating: currentReview.rating,
        comment: currentReview.comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReviewState(prev => ({
        ...prev,
        [productId]: { ...prev[productId], isSubmitting: false, submitted: true, isOpen: false }
      }));
      
      alert('Review submitted successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to submit review');
      setReviewState(prev => ({
        ...prev,
        [productId]: { ...prev[productId], isSubmitting: false }
      }));
    }
  };


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

    const handleStatusUpdate = (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    };

    customerSocket.on('order-status-update', handleStatusUpdate);

    return () => {
      customerSocket.off('order-status-update', handleStatusUpdate);
    };
  }, [id]);

  if (loading) return <div className="loading-box">Checking order status...</div>;
  if (!order) return <div className="loading-box">Order not found</div>;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Accepted': return 'Order accepted & being processed';
      case 'Order Ready to Ship': return 'Packed & ready to ship';
      case 'Rider at hub for pickup': return 'Rider arriving at hub';
      case 'Order Picked': return 'Order picked up by rider';
      case 'Order on way':
      case 'dispatched': return 'Order is on the way';
      case 'Order Delivered': return 'Delivered successfully!';
      case 'Payment Received': return 'Payment received by MatAll';
      case 'Cancelled': return 'This order was cancelled';
      default: return status || 'Processing your order';
    }
  };

  const renderTimeline = () => {
    const statuses = [
      'Accepted', 
      'Order Ready to Ship', 
      'Rider at hub for pickup', 
      'Order Picked', 
      'Order on way', 
      'Order Delivered',
      'Payment Received'
    ];
    
    const currentIndex = statuses.indexOf(order.status);

    return (
      <div className="tracking-timeline-expanded animate-fade-in">
        <div className="timeline-item active">
            <div className="dot"></div>
            <div className="text">Order Received at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
        
        <div className={`timeline-item ${currentIndex >= 0 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Order Accepted & Confirmed</div>
        </div>

        <div className={`timeline-item ${currentIndex >= 1 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Order Packed & Ready</div>
        </div>

        <div className={`timeline-item ${currentIndex >= 2 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Rider reaching Hub for pickup</div>
        </div>

        <div className={`timeline-item ${currentIndex >= 3 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Order Picked up by Rider</div>
        </div>

        <div className={`timeline-item ${currentIndex >= 4 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Order is on the way</div>
        </div>

        <div className={`timeline-item ${currentIndex >= 5 ? 'active' : ''}`}>
            <div className="dot"></div>
            <div className="text">Order Delivered</div>
        </div>

        {(['cod', 'cash on delivery'].includes(order.paymentMethod?.toLowerCase()) || !order.paymentMethod) && (
          <div className={`timeline-item ${currentIndex >= 6 ? 'active' : ''}`}>
              <div className="dot"></div>
              <div className="text">Payment Received</div>
          </div>
        )}

        {order.status === 'Cancelled' && (
          <div className="timeline-item active danger">
              <div className="dot"></div>
              <div className="text">Order Cancelled</div>
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="blinkit-tracking-page">
      <SEO title={`Track Order #${id?.slice(-8).toUpperCase()}`} description="Track your MatAll order status in real-time. See delivery timeline and details." />
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
                  <div key={idx} className="item-row-wrapper-detailed">
                    <div 
                      className="item-row-detailed" 
                      onClick={() => navigate(`/products/${item.productId?._id || item.product?._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                        <div className="item-thumb-box">
                           {(() => {
                              const variantName = item.selectedVariant;
                              const variant = item.productId?.variants?.find((v: any) => v.name === variantName) || item.productId?.variants?.[0];
                              const imgSource = variant?.images?.[0] || item.productId?.images?.[0] || item.productId?.imageUrl || item.product?.images?.[0] || '';
                              return (
                                <img 
                                   src={getFullImageUrl(imgSource)} 
                                   alt="" 
                                   onError={(e) => {
                                     (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400';
                                   }}
                                />
                              );
                           })()}
                        </div>
                       <div className="item-info-col">
                          <p className="item-brand-label" style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>{item.productId?.brand || 'Brand'}</p>
                          <p className="item-name-bold">{item?.productId?.productName || item?.productId?.name || item?.product?.name}</p>
                          
                          {(() => {
                             const variantName = item.selectedVariant;
                             const variant = item.productId?.variants?.find((v: any) => v.name === variantName) || item.productId?.variants?.[0];
                             const rawAttrs = variant?.attributes;
                             const attrs = rawAttrs instanceof Map ? Object.fromEntries(rawAttrs) : rawAttrs;
                             return (
                               <>
                                 <span className="item-variant-label">{variantName || variant?.name || 'Standard'}</span>
                                 {attrs && typeof attrs === 'object' && Object.entries(attrs).length > 0 && (
                                   <div className="item-attributes-mini" style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                                      {Object.entries(attrs).map(([k, v]: any) => (
                                        <span key={k} style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#475569' }}>{k}: {v}</span>
                                      ))}
                                   </div>
                                 )}
                               </>
                             );
                          })()}

                          <div className="item-price-qty-row">
                             <span className="qty-pill">Qty: {item.quantity}</span>
                             <span className="price-bold">₹{item.unitPrice || item.price || 0}</span>
                          </div>
                       </div>
                    </div>
                    {order.status === 'Order Delivered' && (
                      <div className="product-review-actions" style={{ padding: '0 1rem 1rem 1rem', background: '#fff' }}>
                        {reviewState[item?.productId?._id || item?.product?._id]?.submitted ? (
                          <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>✓ Review Submitted</span>
                        ) : (
                          <button 
                            className="write-review-btn-inline" 
                            onClick={() => toggleReviewForm(item?.productId?._id || item?.product?._id)}
                            style={{ fontSize: '0.875rem', color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {reviewState[item?.productId?._id || item?.product?._id]?.isOpen ? 'Cancel Review' : 'Write a Review'}
                          </button>
                        )}
                        
                        {reviewState[item?.productId?._id || item?.product?._id]?.isOpen && !reviewState[item?.productId?._id || item?.product?._id]?.submitted && (
                          <div className="inline-review-form" style={{ marginTop: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <div className="star-rating-row" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                              {[1,2,3,4,5].map(s => (
                                <Star 
                                  key={s} 
                                  size={24} 
                                  fill={s <= (reviewState[item?.productId?._id || item?.product?._id]?.rating || 5) ? "#facc15" : "transparent"} 
                                  color={s <= (reviewState[item?.productId?._id || item?.product?._id]?.rating || 5) ? "#facc15" : "#cbd5e1"}
                                  onClick={() => setReviewState(prev => ({
                                    ...prev,
                                    [item?.productId?._id || item?.product?._id]: {
                                      ...prev[item?.productId?._id || item?.product?._id],
                                      rating: s
                                    }
                                  }))}
                                  className="star-icon"
                                  style={{ cursor: 'pointer', marginRight: '4px' }}
                                />
                              ))}
                            </div>
                            <textarea 
                              placeholder="Share your experience with this product..."
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '60px', marginBottom: '0.75rem', fontSize: '0.875rem' }}
                              value={reviewState[item?.productId?._id || item?.product?._id]?.comment || ''}
                              onChange={(e) => setReviewState(prev => ({
                                ...prev,
                                [item?.productId?._id || item?.product?._id]: {
                                  ...prev[item?.productId?._id || item?.product?._id],
                                  comment: e.target.value
                                }
                              }))}
                            ></textarea>
                            <button 
                              className="submit-feedback-btn" 
                              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', width: 'auto' }}
                              onClick={() => submitProductReview(item?.productId?._id || item?.product?._id)}
                              disabled={reviewState[item?.productId?._id || item?.product?._id]?.isSubmitting}
                            >
                              {reviewState[item?.productId?._id || item?.product?._id]?.isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

        {/* Bill Summary - Reconstructed with safety */}
        <div className="section-container card-style">
           <div className="section-header"><h3>Bill Summary</h3></div>
           <div className="bill-summary-rows">
              <div className="bill-row">
                 <div className="label-with-icon"><Package size={14} /> <span>Items Total (Excl. GST)</span></div>
                 <span>₹{Number((order.totalAmount || 0) - (order.totalTaxAmount || 0) - ((order.deliveryCharge || 0) / 1.18) - ((order.platformFee || 0) / 1.18)).toFixed(2)}</span>
              </div>
              {(order.totalTaxAmount || 0) > 0 && (
                <div className="bill-row">
                  <div className="label-with-icon"><span>Total GST Amount</span></div>
                  <span>₹{Number(order.totalTaxAmount || 0).toFixed(2)}</span>
                </div>
              )}
              {(order.deliveryCharge || 0) > 0 && (
                <div className="bill-row">
                   <div className="label-with-icon"><span>Delivery Fee (Excl. Tax)</span></div>
                   <span>₹{Number((order.deliveryCharge || 0) / 1.18).toFixed(2)}</span>
                </div>
              )}
              {(order.platformFee || 0) > 0 && (
                <div className="bill-row">
                   <div className="label-with-icon"><span>Handling Charge (Excl. Tax)</span></div>
                   <span>₹{Number((order.platformFee || 0) / 1.18).toFixed(2)}</span>
                </div>
              )}
              <div className="bill-row grand-total-row">
                 <strong>Grand Total</strong>
                 <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
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
                 <p className="info-value">
                   {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
              </div>
              <div className="info-block full-width">
                 <span className="info-label">Delivering to</span>
                 <p className="info-value"><strong>{order.deliveryAddress?.name || 'Home'}</strong></p>
                 <p className="info-value" style={{ fontSize: '0.85rem', color: '#64748b' }}>{order.deliveryAddress?.fullAddress || order.shippingAddress || 'No address provided'}</p>
                 {order.deliveryAddress?.contactPhone && (
                   <p className="info-value" style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '800', marginTop: '4px' }}>
                     📞 {order.deliveryAddress.contactPhone}
                   </p>
                 )}
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

           {/* <div 
             className={`action-btn-row-prd ${activeAction === 'feedback' ? 'active' : ''}`}
             onClick={() => setActiveTab(activeAction === 'feedback' ? 'none' : 'feedback')}
           >
              <div className="action-label-box">
                 <Star size={18} />
                 <span>Help us improve</span>
              </div>
              <ChevronDown size={18} className={activeAction === 'feedback' ? 'rotate-180 transition-transform' : 'transition-transform'} />
           </div> */}
        </div>
      </main>
    </div>
  );
};

export default Tracking;
