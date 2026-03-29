import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertCircle,
  Boxes,
  LayoutDashboard,
  ClipboardList,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './supplier-dashboard.css';
import { supplierSocket, connectSocket } from '../socket';
import toast from 'react-hot-toast';

const SupplierDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'in-progress' | 'completed' | 'cancelled'>('available');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch supplier orders:', err);
    }
  };

  const fetchAvailableOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/orders/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableOrders(data);
    } catch (err) {
      console.error('Failed to fetch available orders:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchAvailableOrders()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    connectSocket(supplierSocket);

    supplierSocket.on('order-updated', (updatedOrder: any) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    supplierSocket.on('new-order', () => {
      // Refresh available orders when a new one comes in
      fetchAvailableOrders();
      toast.success('New matching procurement request available!');
    });

    return () => {
      supplierSocket.off('order-updated');
      supplierSocket.off('new-order');
    };
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order accepted and assigned to you!');
      setActiveTab('in-progress');
      loadAll();
    } catch (err) {
      toast.error('Failed to accept order. It might have been taken by another supplier.');
      fetchAvailableOrders();
    }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadAll();
      if (status === 'supplier-confirmed') toast.success('Order confirmed!');
      if (status === 'rejected-by-supplier') toast.error('Order rejected.');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) return <div className="content">Loading Supplier Dashboard...</div>;

  const filterOrders = () => {
    if (activeTab === 'completed') {
      return orders.filter(o => o.status === 'delivered');
    } else if (activeTab === 'cancelled') {
      return orders.filter(o => o.status === 'rejected-by-supplier' || o.status === 'cancelled');
    } else {
      return orders.filter(o => !['delivered', 'rejected-by-supplier', 'cancelled'].includes(o.status));
    }
  };

  const filteredOrders = filterOrders();
  const fulfillmentOrders = filteredOrders.filter(o => ['supplier-confirmed', 'picking', 'packing', 'handover-ready', 'dispatched'].includes(o.status));

  return (
    <main className="content supplier-dashboard" style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
      <header className="supplier-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>Supplier Portal</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{user.fullName} | Global Construction Supplies</p>
        </div>
        <div className="status-badge-live" style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 20px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #bcf0da' }}>
          <div className="pulse-dot" style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '50%' }}></div>
          CONNECTED & LIVE
        </div>
      </header>

      <div className="orders-tabs" style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #f1f5f9', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setActiveTab('available')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'available' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'available' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          Available Requests ({availableOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('in-progress')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'in-progress' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'in-progress' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          My Active Tasks ({orders.filter(o => !['delivered', 'rejected-by-supplier', 'cancelled'].includes(o.status)).length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'completed' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'completed' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          History ({orders.filter(o => o.status === 'delivered').length})
        </button>
      </div>

      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: (activeTab === 'in-progress' || activeTab === 'available') ? '1.2fr 1fr' : '1fr', gap: '2.5rem' }}>
        {activeTab === 'available' ? (
          <>
            <section className="available-requests">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={24} color="#FFEA00" /> Matching Requests
              </h2>
              {availableOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <p>No available orders matching your categories.</p>
                </div>
              ) : (
                <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {availableOrders.map(order => (
                    <div key={order._id} className="order-request-card card" style={{ borderLeft: '6px solid #FFEA00', padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>#REQ-{order._id.slice(-6).toUpperCase()}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.5rem' }}>₹{order.totalAmount.toFixed(2)}</div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>{order.items.length} items</span>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Items in this request:</div>
                        {order.items.map((item: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.quantity}x (Category: {item.category})</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handleAcceptOrder(order._id)} 
                        className="primary-btn" 
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                      >
                        Accept & Fulfill Order
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            
            <aside className="supplier-info">
              <div className="card" style={{ background: '#000', color: '#FFEA00' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Your Expertise</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(user.supplierId?.categories || user.categories)?.map((cat: string, i: number) => (
                    <span key={i} style={{ background: 'rgba(255,234,0,0.1)', border: '1px solid #FFEA00', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                      {cat}
                    </span>
                  ))}
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#fff', opacity: 0.8 }}>
                  You are only seeing orders that match these categories. Update your profile in the Admin Panel to change your expertise.
                </p>
              </div>
            </aside>
          </>
        ) : activeTab === 'in-progress' ? (
          <>
            <section className="active-fulfillment">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Boxes size={24} color="#2563eb" /> My Pipeline
              </h2>
              {fulfillmentOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <p>You have no active orders to fulfill.</p>
                </div>
              ) : (
                <div className="active-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {fulfillmentOrders.map(order => (
                    <div key={order._id} className="active-order-item card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #2563eb' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>#BID-{order._id.slice(-6).toUpperCase()}</h4>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>{order.status.toUpperCase()}</span>
                      </div>
                      <div>
                        {order.status === 'supplier-confirmed' && <button onClick={() => handleStatusUpdate(order._id, 'picking')} className="primary-btn" style={{ padding: '8px 16px' }}>Start Picking</button>}
                        {order.status === 'picking' && <button onClick={() => handleStatusUpdate(order._id, 'packing')} className="primary-btn" style={{ padding: '8px 16px' }}>Move to Packing</button>}
                        {order.status === 'packing' && <button onClick={() => handleStatusUpdate(order._id, 'handover-ready')} className="primary-btn" style={{ padding: '8px 16px', background: '#16a34a' }}>Handover Ready</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="history-section">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>ORDER ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>DATE</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>STATUS</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>#BID-{order._id.slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px',
                          background: order.status === 'delivered' ? '#dcfce7' : '#fef2f2',
                          color: order.status === 'delivered' ? '#16a34a' : '#ef4444'
                        }}>{order.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800 }}>₹{order.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <nav className="supplier-bottom-nav">
        <button className="nav-btn active">
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/reports')}>
          <ClipboardList size={24} />
          <span>Reports</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/actions')}>
          <Zap size={24} />
          <span>Actions</span>
        </button>
      </nav>
    </main>
  );
};

export default SupplierDashboard;
