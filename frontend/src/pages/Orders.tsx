import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  RotateCcw
} from 'lucide-react';
import { getFullImageUrl } from '../utils/imageUrl';
import './orders.css';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/my`, {
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
        <div className="header-left">
           <button className="back-btn" onClick={() => navigate(-1)}>
             <ArrowLeft size={22} />
           </button>
           <div className="header-title">Order History</div>
        </div>
        <Link to="/" className="home-btn-link">
          <Home size={22} />
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
          <div className="orders-stack">
            {orders.map((order) => (
              <div key={order._id} className="order-history-tile">
                <div className="tile-top-info" onClick={() => navigate(`/tracking/${order._id}`)}>
                   <div className="tile-main-details">
                      <span className="savings-highlight">Savings of ₹{(Math.random() * 200).toFixed(0)}, Delivered in 45 mins</span>
                      <p className="order-sub-meta">
                        ₹{order.totalAmount}, {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}, {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                   </div>
                   <ChevronRight size={20} color="#94a3b8" />
                </div>

                <div className="order-thumbs-row">
                   {order.items.slice(0, 4).map((item: any, i: number) => (
                     <div key={i} className="mini-thumb">
                        <img src={getFullImageUrl(item.productId?.imageUrl || item.product?.imageUrl)} alt="" />
                     </div>
                   ))}
                   {order.items.length > 4 && <span className="thumbs-count-more">+{order.items.length - 4}</span>}
                </div>

                <div className="tile-actions">
                   <button className="tile-btn-action">
                      Reorder
                   </button>
                   <div className="btn-v-sep"></div>
                   <button className="tile-btn-action">
                      Rate
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
