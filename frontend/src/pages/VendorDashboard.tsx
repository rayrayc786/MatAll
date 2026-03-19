import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { vendorSocket, connectSocket } from '../socket';
import toast from 'react-hot-toast';

const VendorDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'cancelled'>('in-progress');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch vendor orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    connectSocket(vendorSocket);

    vendorSocket.on('order-updated', (updatedOrder: any) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    vendorSocket.on('new-order', (newOrder: any) => {
      setOrders(prev => [newOrder, ...prev]);
    });

    return () => {
      vendorSocket.off('order-updated');
      vendorSocket.off('new-order');
    };
  }, []);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/vendor/orders/${orderId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      if (status === 'vendor-confirmed') toast.success('Order accepted!');
      if (status === 'rejected-by-vendor') toast.error('Order rejected.');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) return <div className="content">Loading Vendor Dashboard...</div>;

  const filterOrders = () => {
    if (activeTab === 'completed') {
      return orders.filter(o => o.status === 'delivered');
    } else if (activeTab === 'cancelled') {
      return orders.filter(o => o.status === 'rejected-by-vendor' || o.status === 'cancelled');
    } else {
      return orders.filter(o => !['delivered', 'rejected-by-vendor', 'cancelled'].includes(o.status));
    }
  };

  const filteredOrders = filterOrders();
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const fulfillmentOrders = filteredOrders.filter(o => ['vendor-confirmed', 'picking', 'packing', 'handover-ready', 'dispatched'].includes(o.status));

  return (
    <main className="content vendor-dashboard" style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>
      <header className="vendor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>Vendor Portal</h1>
          <p style={{ color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{user.fullName} | Global Construction Supplies</p>
        </div>
        <div className="status-badge-live" style={{ background: '#dcfce7', color: '#16a34a', padding: '10px 20px', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #bcf0da' }}>
          <div className="pulse-dot" style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '50%' }}></div>
          CONNECTED & LIVE
        </div>
      </header>

      <div className="orders-tabs" style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #f1f5f9', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setActiveTab('in-progress')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'in-progress' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'in-progress' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          Active Tasks ({orders.filter(o => !['delivered', 'rejected-by-vendor', 'cancelled'].includes(o.status)).length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'completed' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'completed' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          History / Completed ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button 
          onClick={() => setActiveTab('cancelled')}
          style={{ padding: '1rem 0', border: 'none', background: 'none', fontWeight: 800, color: activeTab === 'cancelled' ? 'var(--primary-dark)' : '#94a3b8', borderBottom: activeTab === 'cancelled' ? '3px solid var(--primary)' : '3px solid transparent', cursor: 'pointer', fontSize: '1rem' }}
        >
          Rejected / Cancelled ({orders.filter(o => o.status === 'rejected-by-vendor' || o.status === 'cancelled').length})
        </button>
      </div>

      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: activeTab === 'in-progress' ? '1.2fr 1fr' : '1fr', gap: '2.5rem' }}>
        {activeTab === 'in-progress' ? (
          <>
            <section className="new-requests">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertCircle size={24} color="#f59e0b" /> Incoming Requests
              </h2>
              {pendingOrders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                  <p>No new order requests.</p>
                </div>
              ) : (
                <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {pendingOrders.map(order => (
                    <div key={order._id} className="order-request-card card" style={{ borderLeft: '6px solid #f59e0b', padding: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ margin: 0 }}>#BID-{order._id.slice(-6).toUpperCase()}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '1.5rem' }}>₹{order.totalAmount.toFixed(2)}</div>
                      </div>
                      <div className="action-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button onClick={() => handleStatusUpdate(order._id, 'rejected-by-vendor')} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ef4444', color: '#ef4444', background: 'white', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                        <button onClick={() => handleStatusUpdate(order._id, 'vendor-confirmed')} style={{ padding: '12px', borderRadius: '10px', border: 'none', color: 'white', background: '#16a34a', fontWeight: 700, cursor: 'pointer' }}>Accept</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="active-fulfillment">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Boxes size={24} color="#2563eb" /> Fulfillment Pipeline
              </h2>
              <div className="active-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fulfillmentOrders.map(order => (
                  <div key={order._id} className="active-order-item card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #2563eb' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>#BID-{order._id.slice(-6).toUpperCase()}</h4>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px' }}>{order.status.toUpperCase()}</span>
                    </div>
                    <div>
                      {order.status === 'vendor-confirmed' && <button onClick={() => handleStatusUpdate(order._id, 'picking')} className="primary-btn" style={{ padding: '8px 16px' }}>Start Picking</button>}
                      {order.status === 'picking' && <button onClick={() => handleStatusUpdate(order._id, 'packing')} className="primary-btn" style={{ padding: '8px 16px' }}>Move to Packing</button>}
                      {order.status === 'packing' && <button onClick={() => handleStatusUpdate(order._id, 'handover-ready')} className="primary-btn" style={{ padding: '8px 16px', background: '#16a34a' }}>Handover Ready</button>}
                    </div>
                  </div>
                ))}
              </div>
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
    </main>
  );
};

export default VendorDashboard;
