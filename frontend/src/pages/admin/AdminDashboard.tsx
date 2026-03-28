import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  Users, 
  Layers, 
  Clock,
  Search,
  Edit2,
  ChevronRight,
  User,
  LogOut,
  Plus,
  Trash2,
  X,
  FileUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
import { adminSocket, connectSocket } from '../../socket';
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'actions'>((tabParam as any) || 'dashboard');
  const [activeActionTab, setActiveActionTab] = useState<'list' | 'users' | 'orders' | 'categories' | 'products' | 'tickets'>('list');
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Management State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, oRes, cRes, pRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users`),
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/admin/categories`),
        axios.get(`${API_BASE}/products`)
      ]);
      
      if (uRes.data) setUsers(uRes.data);
      if (oRes.data) setOrders(oRes.data);
      if (cRes.data) setCategories(cRes.data);
      if (pRes.data) setProducts(pRes.data);
    } catch (err: any) {
      console.error('Fetch failed:', err);
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

  // Real-time socket logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    connectSocket(adminSocket);

    const onConnect = () => console.log('Admin Socket Connected');
    const onNewOrder = (order: any) => {
       console.log('Received socket new-order payload:', order);
       const refId = String(order?._id || order?.id || 'UNKNOWN').slice(-6).toUpperCase();
       toast.success(`🎉 New Order Received! (#${refId})`);
       fetchData(); // Auto-refresh all stats and orders
    };

    adminSocket.on('connect', onConnect);
    adminSocket.on('new-order', onNewOrder);

    return () => {
      adminSocket.off('connect', onConnect);
      adminSocket.off('new-order', onNewOrder);
      // NOTE: Removed adminSocket.disconnect() to prevent breaking the singleton connection on quick re-renders
    };
  }, []);

  const handleAction = async (method: 'post' | 'put' | 'delete', endpoint: string, data?: any) => {
    try {
      const url = `${API_BASE}${endpoint}`;
      if (method === 'delete') {
         await axios.delete(url);
      } else if (method === 'post') {
         await axios.post(url, data);
      } else {
         await axios.put(url, data);
      }
      toast.success('Action successful');
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const openForm = (item: any = null) => {
     setEditingItem(item);
     setFormData(item || {});
     setShowModal(true);
  };

  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    const statuses = ['pending', 'picking', 'dispatched', 'delivered', 'cancelled'];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    await handleAction('patch' as any, `/admin/orders/${orderId}/status`, { status: statuses[nextIdx] });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/products/bulk-upload`, formData);
      toast.success('Bulk upload successful');
      fetchData();
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTabChange = (tab: 'dashboard' | 'reports' | 'actions') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setActiveActionTab('list');
    setSearchTerm(''); // Clear search on tab change
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
      color: '#DEDEDE' 
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
      id: 'products', 
      name: 'Product Management', 
      sub: 'Manage construction items, pricing, SKU, variants etc', 
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
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search Name/Mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-action-btn" onClick={() => openForm()}>
           <Plus size={20} />
        </button>
      </div>
      
      <div className="admin-list-container">
        {users.filter(u => 
          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (u.phoneNumber || '').includes(searchTerm)
        ).length === 0 ? <p className="text-center py-4">No users found.</p> : 
        users.filter(u => 
          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (u.phoneNumber || '').includes(searchTerm)
        ).map((user, i) => (
          <div key={user._id || i} className="admin-list-row-item">
            <div className="row-user-avatar"><User size={20} /></div>
            <div className="row-user-info">
              <span className="row-name">{user.fullName || 'No Name'}</span>
              <span className="row-sub">{user.phoneNumber || user.email || 'No Mobile'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(user)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/users/${user._id}`)}><Trash2 size={16} /></button>
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
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search ID/Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="admin-list-container">
        {orders.filter(o => 
          (o.userId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (o._id || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No orders found.</p> : 
        orders.filter(o => 
          (o.userId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (o._id || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((order, i) => (
          <div key={order._id || i} className="admin-list-row-item order-variant">
            <div className="row-left-info" onClick={() => setViewingOrder(order)}>
               <span className="row-name">{order.userId?.fullName || 'Guest'}</span>
               <span className="row-sub">{order.userId?.phoneNumber || 'No Contact'}</span>
            </div>
            <div className="row-mid-info" onClick={() => setViewingOrder(order)}>
               <span className="row-name">Order #{order._id.slice(-6).toUpperCase()}</span>
               <span className="row-sub">₹{order.totalAmount || 0}</span>
            </div>
            <div className="row-status-icons" onClick={() => handleStatusChange(order._id, order.status)}>
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
        <button className="add-action-btn" onClick={() => openForm()}>
           <Plus size={20} />
        </button>
      </div>
      <div className="admin-list-container">
        {categories.length === 0 ? <p className="text-center py-4">No categories found.</p> : categories.map((cat, i) => (
          <div key={cat._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{cat.name}</span>
              <span className="row-sub">{cat.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(cat)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/categories/${cat._id}`)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <button className="back-btn" onClick={() => setActiveActionTab('list')}>←</button>
          <h2>Product Management</h2>
        </div>
        <div className="management-actions-row">
           <div className="search-bar-admin compact">
              <input 
                type="text" 
                placeholder="Search Material/SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             accept=".xlsx, .xls"
             onChange={handleBulkUpload} 
           />
           <button className="add-action-btn secondary" onClick={() => fileInputRef.current?.click()} title="Bulk Upload">
              <FileUp size={20} />
           </button>
           <button className="add-action-btn" onClick={() => openForm()}>
              <Plus size={20} />
           </button>
        </div>
      </div>
      <div className="admin-list-container">
        {products.filter(p => 
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No products found.</p> : 
        products.filter(p => 
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((prod, i) => (
          <div key={prod._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{prod.name}</span>
              <span className="row-sub">{prod.brand} | {prod.category}</span>
            </div>
            <div className="row-mid-info">
               <span className="row-name">₹{prod.price}</span>
               <span className="row-sub">SKU: {prod.sku || 'N/A'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(prod)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/products/${prod._id}`)}><Trash2 size={16} /></button>
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

  const OrderDetailsModal = () => {
    if (!viewingOrder) return null;
    const order = viewingOrder;

    return (
      <div className="admin-modal-overlay" onClick={() => setViewingOrder(null)}>
        <div className="admin-modal-content order-details-modal animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Order Details #{order._id.slice(-6).toUpperCase()}</h3>
            <button className="close-btn" onClick={() => setViewingOrder(null)}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
             <div className="order-meta-info">
                <div className="meta-item">
                   <label>Customer</label>
                   <span>{order.userId?.fullName || 'Guest'}</span>
                </div>
                <div className="meta-item">
                   <label>Contact</label>
                   <span>{order.userId?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="meta-item">
                   <label>Payment</label>
                   <span className="uppercase">{order.paymentMethod}</span>
                </div>
             </div>

             <div className="order-items-list">
                <h4>Items ({order.items?.length || 0})</h4>
                {order.items?.map((item: any, idx: number) => (
                   <div key={idx} className="order-item-row">
                      <div className="item-img">
                         <img src={item.productId?.images?.[0] || 'https://via.placeholder.com/50'} alt="" />
                      </div>
                      <div className="item-info">
                         <span className="item-name">{item.productId?.name || 'Unknown Product'}</span>
                         <span className="item-sub">Qty: {item.quantity} × ₹{item.unitPrice}</span>
                      </div>
                      <div className="item-total">
                         ₹{item.quantity * item.unitPrice}
                      </div>
                   </div>
                ))}
             </div>

             <div className="order-summary-box">
                <div className="summary-row">
                   <span>Subtotal</span>
                   <span>₹{order.totalAmount}</span>
                </div>
                <div className="summary-row total">
                   <span>Grand Total</span>
                   <span>₹{order.totalAmount}</span>
                </div>
             </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn save" onClick={() => setViewingOrder(null)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const ManagementModal = () => {
    if (!showModal) return null;
    const isEditing = !!editingItem;
    const type = activeActionTab;

    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-content animate-slide-up">
          <div className="modal-header">
            <h3>{isEditing ? 'Edit' : 'Add New'} {type === 'users' ? 'User' : (type === 'categories' ? 'Category' : 'Product')}</h3>
            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
          </div>
          
          <div className="modal-body">
            {type === 'products' && (
              <div className="modal-scroll-area">
                <div className="input-group-admin">
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Century Ply Sainik 710"
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="input-row-admin">
                   <div className="input-group-admin">
                      <label>SKU (Product Code)</label>
                      <input 
                        type="text" 
                        placeholder="FLY-CEN-710" 
                        value={formData.sku || ''} 
                        onChange={e => setFormData({...formData, sku: e.target.value})} 
                      />
                   </div>
                   <div className="input-group-admin">
                      <label>Brand</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Century" 
                        value={formData.brand || ''} 
                        onChange={e => setFormData({...formData, brand: e.target.value})} 
                      />
                   </div>
                </div>
                <div className="input-row-admin">
                   <div className="input-group-admin">
                      <label>Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Plywood" 
                        value={formData.category || ''} 
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                      />
                   </div>
                   <div className="input-group-admin">
                      <label>Sub Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Marine Grade" 
                        value={formData.subCategory || ''} 
                        onChange={e => setFormData({...formData, subCategory: e.target.value})} 
                      />
                   </div>
                </div>
                <div className="input-row-admin">
                   <div className="input-group-admin">
                      <label>Price (₹)</label>
                      <input 
                        type="number" 
                        value={formData.price || ''} 
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                      />
                   </div>
                   <div className="input-group-admin">
                      <label>MRP (₹)</label>
                      <input 
                        type="number" 
                        value={formData.mrp || ''} 
                        onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} 
                      />
                   </div>
                </div>
                <div className="input-row-admin">
                   <div className="input-group-admin">
                      <label>Weight (kg)</label>
                      <input 
                        type="number" 
                        value={formData.weightPerUnit || 0} 
                        onChange={e => setFormData({...formData, weightPerUnit: Number(e.target.value)})} 
                      />
                   </div>
                   <div className="input-group-admin">
                      <label>Volume (m³)</label>
                      <input 
                        type="number" 
                        value={formData.volumePerUnit || 0} 
                        onChange={e => setFormData({...formData, volumePerUnit: Number(e.target.value)})} 
                      />
                   </div>
                </div>
                <div className="input-group-admin">
                  <label>Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Technical specifications, features etc"
                    value={formData.description || ''} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div className="input-row-admin">
                   <div className="input-group-admin checkbox">
                      <input 
                        type="checkbox" 
                        id="prodActive"
                        checked={formData.isActive !== false} 
                        onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                      />
                      <label htmlFor="prodActive">Is Active</label>
                   </div>
                   <div className="input-group-admin checkbox">
                      <input 
                        type="checkbox" 
                        id="prodPopular"
                        checked={!!formData.isPopular} 
                        onChange={e => setFormData({...formData, isPopular: e.target.checked})} 
                      />
                      <label htmlFor="prodPopular">Mark as Popular</label>
                   </div>
                </div>
              </div>
            )}

            {type === 'users' && (
              <>
                <div className="input-group-admin">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Arora"
                    value={formData.fullName || ''} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  />
                </div>
                <div className="input-group-admin">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9988776655" 
                    value={formData.phoneNumber || ''} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                  />
                </div>
                <div className="input-group-admin">
                  <label>Role</label>
                  <select 
                    value={formData.role || 'Buyer'} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Admin">Admin</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
              </>
            )}

            {type === 'categories' && (
              <>
                <div className="input-group-admin">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sanitary Ware" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="input-group-admin checkbox">
                  <input 
                    type="checkbox" 
                    id="catActive"
                    checked={formData.isActive !== false} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                  />
                  <label htmlFor="catActive">Is Active</label>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
            <button 
              className="modal-btn save" 
              onClick={() => handleAction(
                isEditing ? 'put' : 'post', 
                `/admin/${type}${isEditing ? `/${editingItem._id}` : ''}`, 
                formData
              )}
            >
              {isEditing ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    if (activeActionTab === 'users') return renderUserManagement();
    if (activeActionTab === 'orders') return renderOrderManagement();
    if (activeActionTab === 'categories') return renderCategoryManagement();
    if (activeActionTab === 'products') return renderProductManagement();
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
        <div className="header-right-actions">
           <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
           </button>
           <div className="admin-profile-dot"></div>
        </div>
      </header>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'reports' && (
        <div className="admin-scroll-content animate-fade-in">
          <Reports contentOnly={true} />
        </div>
      )}
      {activeTab === 'actions' && renderActions()}
      <ManagementModal />
      <OrderDetailsModal />

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
