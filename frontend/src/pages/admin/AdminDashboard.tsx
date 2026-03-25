import React, { useState } from 'react';
import { 
  Package, 
  Users, 
  Layers, 
  Clock
} from 'lucide-react';
import './admin-dashboard.css';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'actions'>('dashboard');

  const TILES = [
    { label: 'Active Orders', val: '20', icon: <Package size={24} />, color: '#FFEA00' },
    { label: 'Active Suppliers', val: '10', icon: <Users size={24} />, color: '#f8fafc' },
    { label: 'Active Categories', val: '3', icon: <Layers size={24} />, color: '#f8fafc' },
    { label: 'Avg Delivery Time', val: '25 mins', icon: <Clock size={24} />, color: '#f8fafc' },
  ];

  const REPORT_GROUPS = [
    {
      title: 'Financial Reports',
      items: [
        { name: 'Payout Reconciliation', sub: 'Reports to reconcile all receivables and payouts.' },
        { name: 'Revenue Recognition', sub: 'Access revenue reports, track trends with charts.' }
      ]
    },
    {
      title: 'Analytics',
      items: [
        { name: 'Billing Analytics', sub: 'Monitor key categories and invoice metrics like MRR.' },
        { name: 'Revenue Analytics', sub: 'Reports about revenue generated per category.' }
      ]
    },
    {
      title: 'Support',
      items: [
        { name: 'Ticket Analytics', sub: 'Report on the support tickets or queries raised.' },
        { name: 'Feedback and Rating', sub: 'Report on what kind of queries, buying trends.' }
      ]
    }
  ];

  const ACTION_ITEMS = [
    { name: 'User Management', sub: 'Enter basic details of a user, send SMS/WhatsApp.', color: '#FFEA00' },
    { name: 'Order Management', sub: 'Access revenue reports, track trends with charts.', color: '#f1f5f9' },
    { name: 'Category Management', sub: 'Monitor key categories and invoice metrics.', color: '#f1f5f9' },
    { name: 'Review Support Tickets', sub: 'Reports about revenue generated per category.', color: '#f1f5f9' }
  ];

  const renderDashboard = () => (
    <div className="admin-scroll-content animate-fade-in">
      {/* Metric Tiles */}
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

      {/* Revenue Section */}
      <section className="admin-section-box">
         <div className="section-header">
            <h3>Revenue</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         <div className="revenue-graph-placeholder">
            <div className="mock-graph">
               <div className="graph-line"></div>
               <div className="graph-points">
                  <div className="point p1"></div>
                  <div className="point p2 active"></div>
               </div>
            </div>
            <div className="graph-legend">
               <span>S</span> <span>M</span> <span>T</span> <span>W</span> <span>T</span> <span>F</span> <span>S</span>
            </div>
         </div>
      </section>

      {/* B2B Orders Section */}
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
                 <div className="b2b-amount">{order.amount}</div>
                 <button className="new-order-btn">New Order</button>
              </div>
            ))}
         </div>
      </section>
    </div>
  );

  const renderReports = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="reports-screen-container">
        {REPORT_GROUPS.map((group, idx) => (
          <div key={idx} className="report-group-box">
            <h3 className="group-title-label">{group.title}</h3>
            <div className="report-items-list">
              {group.items.map((item, iIdx) => (
                <div key={iIdx} className={`report-card-item ${iIdx === 0 && idx === 0 ? 'yellow' : ''}`}>
                  <h4>{item.name}</h4>
                  <p>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="actions-screen-container">
        {ACTION_ITEMS.map((item, idx) => (
          <div key={idx} className="action-category-card" style={{ backgroundColor: item.color }}>
            <h4>{item.name}</h4>
            <p>{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="matall-admin-dashboard">
      <header className="admin-dash-header">
        <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        <div className="admin-profile-dot"></div>
      </header>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'actions' && renderActions()}

      <footer className="admin-footer-nav">
         <button 
           className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
           onClick={() => setActiveTab('dashboard')}
         >
           Dashboard
         </button>
         <button 
           className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
           onClick={() => setActiveTab('reports')}
         >
           Reports
         </button>
         <button 
           className={`nav-item ${activeTab === 'actions' ? 'active' : ''}`}
           onClick={() => setActiveTab('actions')}
         >
           Actions
         </button>
      </footer>
    </div>
  );
};

export default AdminDashboard;
