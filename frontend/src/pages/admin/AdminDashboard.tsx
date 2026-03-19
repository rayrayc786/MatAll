import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Package, Truck, Clock } from 'lucide-react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`);
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="content">Loading dashboard metrics...</div>;

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Operational Dashboard</h1>
          <p>Real-time logistics & GMV analytics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <Clock size={16} /> Last updated: {new Date().toLocaleTimeString()}
        </div>
      </header>

      <div className="stats-grid">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '12px' }}><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Gross Merch Value</span>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{stats.gmv.toLocaleString()}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '12px' }}><Truck size={24} /></div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Deliveries</span>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.activeDeliveries}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px' }}><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SLA Breach Alerts</span>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.lateOrders} Late</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#475569', padding: '1rem', borderRadius: '12px' }}><Package size={24} /></div>
          <div className="stat-info">
            <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Orders Today</span>
            <div className="value" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalOrders}</div>
          </div>
        </div>
      </div>

      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} color="#2563eb" /> GMV Velocity (Hourly)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.hourlyGMV}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={20} color="#8b5cf6" /> Order Status Dist.</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Pending', value: 12 },
                { name: 'Picking', value: 5 },
                { name: 'Dispatched', value: 8 },
                { name: 'Delivered', value: 45 }
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  { [0,1,2,3].map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#3b82f6' : index === 2 ? '#8b5cf6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', border: 'none', background: '#f1f5f9' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} color="#ef4444" /> Live Logistics Alerts</h3>
        <div className="incident-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stats.lateOrders > 0 && (
            <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>CRITICAL</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>SLA RISK</strong>: {stats.lateOrders} orders are exceeding 1-hour delivery threshold.</p>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>JUST NOW</span>
            </div>
          )}
          <div style={{ background: 'white', padding: '1rem 1.25rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>INFO</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Fleet capacity at 85%. Recommend activating surge drivers.</p>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>5 MIN AGO</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
