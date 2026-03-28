import React, { useState } from 'react';
import { 
  Package, 
  Users, 
  Layers, 
  Clock,
  Search,
  Edit2,
  CheckCircle,
  Truck,
  DollarSign,
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'actions'>('dashboard');
  const [activeActionTab, setActiveActionTab] = useState<'list' | 'users' | 'orders'>('list');

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
        {[
          { name: 'Rahul Arora', mobile: '9876543210' },
          { name: 'Aman Deep', mobile: '9123456789' },
          { name: 'Sonia Verma', mobile: '8877665544' },
          { name: 'Vikram Singh', mobile: '7766554433' },
          { name: 'Priya Raj', mobile: '9988776655' },
          { name: 'Arjun Dev', mobile: '6655443322' },
          { name: 'Meera Kapur', mobile: '5544332211' }
        ].map((user, i) => (
          <div key={i} className="admin-list-row-item">
            <div className="row-user-avatar"><User size={20} /></div>
            <div className="row-user-info">
              <span className="row-name">{user.name}</span>
              <span className="row-sub">{user.mobile}</span>
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
        {[
          { user: 'User 123', mobile: '9876543210', details: 'Cement (50 Bags)' },
          { user: 'User 456', mobile: '9123456789', details: 'Bricks (2000 Units)' },
          { user: 'User 789', mobile: '8877665544', details: 'Steel Rods (10 Bundles)' },
          { user: 'User 101', mobile: '7766554433', details: 'Sand (2 Trucks)' },
          { user: 'User 202', mobile: '9988776655', details: 'Gravel (1 Truck)' },
          { user: 'User 303', mobile: '6655443322', details: 'Paint (20 Liters)' }
        ].map((item, i) => (
          <div key={i} className="admin-list-row-item order-variant">
            <div className="row-left-info">
               <span className="row-name">{item.user}</span>
               <span className="row-sub">{item.mobile}</span>
            </div>
            <div className="row-mid-info">
               <span className="row-name">Order</span>
               <span className="row-sub">{item.details}</span>
            </div>
            <div className="row-status-icons">
              <CheckCircle size={18} color="#000" />
              <Truck size={18} color="#000" />
              <DollarSign size={18} color="#000" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActions = () => {
    if (activeActionTab === 'users') return renderUserManagement();
    if (activeActionTab === 'orders') return renderOrderManagement();

    return (
      <div className="admin-scroll-content animate-fade-in">
        <div className="actions-screen-container">
          {ACTION_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className="action-category-card" 
              style={{ backgroundColor: item.color }}
              onClick={() => (item.id === 'users' || item.id === 'orders') && setActiveActionTab(item.id as any)}
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
           onClick={() => { setActiveTab('dashboard'); setActiveActionTab('list'); }}
         >
           Dashboard
         </button>
         <button 
           className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
           onClick={() => { setActiveTab('reports'); setActiveActionTab('list'); }}
         >
           Reports
         </button>
         <button 
           className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
           onClick={() => { setActiveTab('actions'); setActiveActionTab('list'); }}
         >
           Actions
         </button>
      </footer>
    </div>
  );
};

export default AdminDashboard;
