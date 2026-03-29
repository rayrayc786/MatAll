import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Zap, 
  MapPin, 
  Package, 
  TrendingUp
} from 'lucide-react';

const RiderDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiderData = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      const statsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/rider-stats`, config);
      const ordersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/available`, config);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      setStats(statsRes.data);
      setAvailableTasks(ordersRes.data);
      setIsOnline(user.isOnline);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, []);

  const toggleDuty = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/toggle-duty`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsOnline(data.isOnline);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.isOnline = data.isOnline;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
  };

  const acceptTask = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Task accepted! Proceed to dark store for pickup.');
      fetchRiderData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="content">Loading Rider Portal...</div>;

  return (
    <main className="content rider-dashboard main-content-responsive">
      <header className="rider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Duty Dashboard</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Welcome back, Partner</p>
        </div>
        <div className={`duty-toggle ${isOnline ? 'online' : 'offline'}`} onClick={toggleDuty} style={{
          display: 'flex', alignItems: 'center', gap: '12px', background: isOnline ? '#dcfce7' : '#f1f5f9',
          padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', border: '1px solid',
          borderColor: isOnline ? '#16a34a' : '#e2e8f0', transition: 'all 0.2s'
        }}>
          <Zap size={18} fill={isOnline ? '#16a34a' : 'none'} color={isOnline ? '#16a34a' : '#64748b'} />
          <span style={{ fontWeight: 800, color: isOnline ? '#16a34a' : '#64748b' }}>
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </span>
        </div>
      </header>

      <section className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Today's Earnings</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px' }}>₹{stats.todayEarnings.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Completed</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: '#16a34a' }}>{stats.totalDeliveries}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Missed</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: '#ef4444' }}>{stats.missedDeliveries}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rating</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '8px', color: '#f59e0b' }}>⭐ {stats.rating}</div>
        </div>
      </section>

      <section className="available-tasks">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Available Logistics Tasks</h2>
        {!isOnline ? (
          <div className="card offline-notice" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc' }}>
            <Zap size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <h3>You are currently Offline</h3>
            <p style={{ color: '#64748b' }}>Go online to start receiving high-payout material delivery tasks.</p>
          </div>
        ) : availableTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Package size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <h3>Searching for tasks...</h3>
            <p style={{ color: '#64748b' }}>High-weight industrial orders will appear here.</p>
          </div>
        ) : (
          <div className="tasks-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {availableTasks.map(task => (
              <div key={task._id} className="task-card card" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>{task.vehicleClass} REQUIRED</span>
                  <span style={{ fontWeight: 900, color: '#16a34a' }}>+ ₹45.00</span>
                </div>
                <h3 style={{ margin: '0 0 1rem 0' }}>#BID-{task._id.slice(-6).toUpperCase()}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#475569', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} /> <span>{task.totalWeight}kg Materials</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} /> <span>Pickup: Bangalore Dark Store #04</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} /> <span>Delivery: {task.deliveryAddress?.name || 'Jobsite Location'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => acceptTask(task._id)}
                  style={{ width: '100%', marginTop: '1.5rem', background: '#0f172a', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Accept Task
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default RiderDashboard;
