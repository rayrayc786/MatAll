import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Star, 
  RotateCcw
} from 'lucide-react';
import './orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="blinkit-orders-page">
      <header className="orders-header-sticky">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-title">Order History</div>
        <Link to="/" className="home-btn-link">
          <Home size={24} />
        </Link>
      </header>

      <main className="orders-content">
        {loading ? (
          <div className="loading-box">Fetching your history...</div>
        ) : orders.length === 0 ? (
          <div className="empty-orders-state">
            <RotateCcw size={64} color="#e2e8f0" />
            <p>No orders placed yet</p>
            <Link to="/products" className="browse-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list-vertical">
            {orders.map((order) => (
              <div key={order._id} className="order-history-card">
                <div className="card-top-summary" onClick={() => navigate(`/tracking/${order._id}`)}>
                   <div className="summary-text-col">
                      <span className="savings-msg">Savings of ₹{(Math.random() * 200).toFixed(0)}</span>
                      <p className="delivery-status-msg">
                        {order.status === 'Delivered' ? `Delivered in 45 mins` : order.status}
                      </p>
                      <span className="order-meta-info">
                        ₹{order.totalAmount} • {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                   </div>
                   <ChevronRight size={20} color="#94a3b8" />
                </div>

                <div className="order-items-preview">
                   {order.items.slice(0, 3).map((item: any, i: number) => (
                     <div key={i} className="mini-item-thumb">
                        <img src={item.product.imageUrl} alt="" />
                     </div>
                   ))}
                   {order.items.length > 3 && <span className="extra-items-count">+{order.items.length - 3} more</span>}
                </div>

                <div className="card-action-btns">
                   <button className="order-action-btn reorder">
                      <RotateCcw size={16} /> Reorder
                   </button>
                   <div className="btn-divider"></div>
                   <button className="order-action-btn rate">
                      <Star size={16} /> Rate
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
