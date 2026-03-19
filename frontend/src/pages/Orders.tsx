import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, MapPin, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'cancelled'>('in-progress');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const { data } = await axios.get('http://localhost:3000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setOrders(data.filter((o: any) => o.userId === user._id));
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, [navigate]);

  const filterOrders = () => {
    if (activeTab === 'completed') {
      return orders.filter(o => o.status === 'delivered');
    } else if (activeTab === 'cancelled') {
      return orders.filter(o => o.status === 'cancelled' || o.status === 'rejected-by-vendor');
    } else {
      return orders.filter(o => !['delivered', 'cancelled', 'rejected-by-vendor'].includes(o.status));
    }
  };

  if (loading) return <div className="content">Loading your orders...</div>;

  const filteredOrders = filterOrders();

  return (
    <main className="content orders-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>My Procurement Orders</h1>
        <p style={{ color: '#64748b' }}>Track and manage your industrial material deliveries</p>
      </header>

      <div className="orders-tabs" style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #f1f5f9', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setActiveTab('in-progress')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'in-progress' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'in-progress' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          In Progress ({orders.filter(o => !['delivered', 'cancelled', 'rejected-by-vendor'].includes(o.status)).length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'completed' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'completed' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          Completed ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button 
          onClick={() => setActiveTab('cancelled')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'cancelled' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'cancelled' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          Cancelled ({orders.filter(o => o.status === 'cancelled' || o.status === 'rejected-by-vendor').length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          {activeTab === 'in-progress' ? <Loader2 size={48} className="animate-spin" /> : activeTab === 'completed' ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
          <h3 style={{ marginTop: '1.5rem' }}>No {activeTab.replace('-', ' ')} orders</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Orders matching this status will appear here.</p>
          {activeTab === 'in-progress' && <button onClick={() => navigate('/products')} className="btn-primary-lg" style={{ margin: '0 auto' }}>Browse Materials</button>}
        </div>
      ) : (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map(order => (
            <div key={order._id} className="order-card-user card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                  <Package size={24} color="#475569" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>#BID-{order._id.slice(-6).toUpperCase()}</h3>
                    <span className={`status-badge-user ${order.status}`} style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px',
                      background: order.status === 'delivered' ? '#dcfce7' : (order.status === 'cancelled' || order.status === 'rejected-by-vendor') ? '#fef2f2' : '#eff6ff',
                      color: order.status === 'delivered' ? '#16a34a' : (order.status === 'cancelled' || order.status === 'rejected-by-vendor') ? '#ef4444' : '#2563eb'
                    }}>
                      {order.status.replace(/-/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ marginTop: '8px', color: '#64748b', fontSize: '0.9rem', display: 'flex', gap: '1.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {order.deliveryAddress?.name}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>₹{order.totalAmount.toFixed(2)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{order.items.length} items | {order.totalWeight}kg</div>
                </div>
                <button 
                  onClick={() => navigate(`/tracking/${order._id}`)}
                  className="icon-btn" 
                  style={{ background: '#0f172a', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '10px' }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Orders;
