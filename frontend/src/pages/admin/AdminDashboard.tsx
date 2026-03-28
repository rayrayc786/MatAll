import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  Users, 
  Layers, 
  Clock,
  Search,
  Edit2,
  CheckCircle,
  ChevronRight,
  User,
  Menu
} from 'lucide-react';
import Reports from '../Reports';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import './admin-dashboard.css';

const REVENUE_DATA = [
  { day: 'S', revenue: 10000 },
  { day: 'M', revenue: 11000 },
  { day: 'T', revenue: 12000 },
  { day: 'W', revenue: 13000 },
  { day: 'T', revenue: 16000 },
  { day: 'F', revenue: 14000 },
  { day: 'S', revenue: 15000 },
];

const ORDERS_STATS_DATA = [
  { week: 'Mar\'25 W1', orders: 25, fulfilled: 25, delayed: 5 },
  { week: 'Mar\'25 W2', orders: 32, fulfilled: 30, delayed: 2 },
  { week: 'Mar\'25 W3', orders: 16, fulfilled: 16, delayed: 5 },
  { week: 'Mar\'25 W4', orders: 20, fulfilled: 20, delayed: 5 },
];

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'actions'>((tabParam as any) || 'dashboard');
  const [activeActionTab, setActiveActionTab] = useState<'list' | 'users' | 'orders' | 'categories' | 'tickets'>('list');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('--- Initializing Admin Data Fetch ---');
      console.log('API Base:', API_BASE);
      
      // Ping check
      const ping = await axios.get(`${API_BASE}/admin/ping`).catch(e => e.response);
      console.log('Admin Ping Result:', ping?.status || 'network error', ping?.data);

      const [uRes, oRes, cRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users`),
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/admin/categories`)
      ]);
      
      if (uRes.data) setUsers(uRes.data);
      if (oRes.data) setOrders(oRes.data);
      if (cRes.data) setCategories(cRes.data);
    } catch (err: any) {
      console.error('Fetch failed:', err.response?.status || err.message, err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tabParam && ['dashboard', 'reports', 'actions'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'dashboard' | 'reports' | 'actions') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setActiveActionTab('list');
  };

  const TILES = [
    { label: 'Active Orders', val: '20', icon: <Package size={20} />, color: '#FFEA00' },
    { label: 'Active Suppliers', val: '10', icon: <Users size={20} />, color: '#DEDEDE' },
    { label: 'Active Categories', val: '3', icon: <Layers size={20} />, color: '#DEDEDE' },
    { label: 'Avg Delivery Time', val: '25 mins', icon: <Clock size={20} />, color: '#DEDEDE' },
  ];

  const ACTION_ITEMS = [
    { 
      id: 'users', 
      name: 'User Management', 
      sub: 'Enter basic details of a user, that send the user a SMS and WhatsApp message to download the app and start using MatAll', 
      color: '#FFEA00' 
    },
    { 
      id: 'orders', 
      name: 'Order Management', 
      sub: 'Access revenue reports, track trends with charts, and forecast using data', 
      color: '#DEDEDE' 
    },
    { 
      id: 'categories', 
      name: 'Category Management', 
      sub: 'Monitor key categories and invoice metrics like MRR, retention, collections, B2B Account revenue etc', 
      color: '#DEDEDE' 
    },
    { 
      id: 'tickets', 
      name: 'Review Support Tickets', 
      sub: 'Reports about revenue generated per category, per product type, per brand, order size etc', 
      color: '#DEDEDE' 
    }
  ];

  const renderDashboard = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="admin-tiles-grid">
         {TILES.map((tile, idx) => (
           <div key={idx} className="admin-metric-tile" style={{ backgroundColor: tile.color }}>
              <div className="tile-top">
                 <span className="tile-val">{tile.val}</span>
                 {tile.icon}
              </div>
              <span className="tile-label">{tile.label}</span>
           </div>
         ))}
      </div>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>Revenue</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis hide domain={[0, 20000]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </section>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>Orders</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ORDERS_STATS_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                <Bar dataKey="orders" fill="#FFEA00" radius={[4, 4, 0, 0]} name="Orders" />
                <Bar dataKey="fulfilled" fill="#000000" radius={[4, 4, 0, 0]} name="Fulfilled" />
                <Bar dataKey="delayed" fill="#DEDEDE" radius={[4, 4, 0, 0]} name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </section>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>B2B Orders</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         
         <div className="b2b-orders-list">
            {[
              { name: 'Sierra Interior', date: 'Mar 22, 2025', amount: '+ 10,000', code: 'SI' },
              { name: 'Benchmarks', date: 'Mar 26, 2025', amount: '+ 1,00,000', code: 'BM' },
              { name: 'Sierra Interior', date: 'Mar 22, 2025', amount: '+ 2,00,000', code: 'SI' },
            ].map((order, idx) => (
              <div key={idx} className="b2b-order-row">
                 <div className="b2b-avatar">{order.code}</div>
                 <div className="b2b-info">
                    <h4>{order.name}</h4>
                    <span>{order.date}</span>
                 </div>
                 <div className="b2b-amount-group">
                    <span className="amount-val">{order.amount}</span>
                    <button className="new-order-badge">New Order</button>
                 </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );

  // renderReports removed, using imported Reports component directly

  const renderUserManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card yellow">
        <div className="header-info">
          <button className="back-btn" onClick={() => setActiveActionTab('list')}>←</button>
          <h2>User Management</h2>
        </div>
        <Search size={20} className="search-icon-right" />
      </div>
      
      <div className="admin-list-container">
        {users.length === 0 ? <p className="text-center py-4">No users found.</p> : users.map((user, i) => (
          <div key={user._id || i} className="admin-list-row-item">
            <div className="row-user-avatar"><User size={20} /></div>
            <div className="row-user-info">
              <span className="row-name">{user.name || 'No Name'}</span>
              <span className="row-sub">{user.mobile || user.email || 'No Mobile'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn"><Edit2 size={16} /></button>
              <button className="list-icon-btn success"><CheckCircle size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrderManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <button className="back-btn" onClick={() => setActiveActionTab('list')}>←</button>
          <h2>Order Management</h2>
        </div>
        <Search size={20} className="search-icon-right" />
      </div>
      
      <div className="admin-list-container">
        {orders.length === 0 ? <p className="text-center py-4">No orders found.</p> : orders.map((order, i) => (
          <div key={order._id || i} className="admin-list-row-item order-variant">
            <div className="row-left-info">
               <span className="row-name">{order.user?.name || 'Guest'}</span>
               <span className="row-sub">{order.user?.mobile || 'No Contact'}</span>
            </div>
            <div className="row-mid-info">
               <span className="row-name">Order #{i+1}</span>
               <span className="row-sub">{order.totalAmount ? `₹${order.totalAmount}` : 'No Amount'}</span>
            </div>
            <div className="row-status-icons">
               <span className={`status-pill ${order.status}`}>{order.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <button className="back-btn" onClick={() => setActiveActionTab('list')}>←</button>
          <h2>Category Management</h2>
        </div>
        <Search size={20} className="search-icon-right" />
      </div>
      <div className="admin-list-container">
        {categories.length === 0 ? <p className="text-center py-4">No categories found.</p> : categories.map((cat, i) => (
          <div key={cat._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{cat.name}</span>
              <span className="row-sub">{cat.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn"><Edit2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTicketManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <button className="back-btn" onClick={() => setActiveActionTab('list')}>←</button>
          <h2>Support Tickets</h2>
        </div>
      </div>
      <div className="admin-list-container">
        <p className="text-center py-10" style={{ fontFamily: 'monospace' }}>
          Ticket System Implementation Pending Backend Integration.
        </p>
      </div>
    </div>
  );

  const renderActions = () => {
    if (activeActionTab === 'users') return renderUserManagement();
    if (activeActionTab === 'orders') return renderOrderManagement();
    if (activeActionTab === 'categories') return renderCategoryManagement();
    if (activeActionTab === 'tickets') return renderTicketManagement();

    return (
      <div className="admin-scroll-content animate-fade-in">
        <div className="actions-screen-container">
          {ACTION_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className="action-category-card" 
              style={{ backgroundColor: item.color }}
              onClick={() => setActiveActionTab(item.id as any)}
            >
              <div className="card-content">
                <h4>{item.name}</h4>
                <p>{item.sub}</p>
              </div>
              <ChevronRight size={20} className="arrow-icon" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20" style={{ height: '70vh', fontFamily: 'monospace' }}>
      Loading Dashboard Data...
    </div>
  );

  return (
    <div className="matall-admin-dashboard">
      <header className="admin-dash-header">
        <div className="header-left">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        </div>
        <div className="admin-profile-dot"></div>
      </header>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'reports' && (
        <div className="admin-scroll-content animate-fade-in">
          <Reports contentOnly={true} />
        </div>
      )}
      {activeTab === 'actions' && renderActions()}

      <footer className="admin-footer-nav">
         <button 
           className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
           onClick={() => handleTabChange('dashboard')}
         >
           Dashboard
         </button>
         <button 
           className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
           onClick={() => handleTabChange('reports')}
         >
           Reports
         </button>
         <button 
           className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
           onClick={() => handleTabChange('actions')}
         >
           Actions
         </button>
      </footer>
    </div>
  );
};

export default AdminDashboard;
