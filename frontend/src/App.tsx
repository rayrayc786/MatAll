import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import toast from 'react-hot-toast';

// User Pages
import Home from './pages/Home';
import Login from './pages/Login';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Tracking from './pages/Tracking';
import VendorStore from './pages/VendorStore';
import BrandStore from './pages/BrandStore';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import SearchFilter from './pages/SearchFilter';
import SubCategoryPage from './pages/SubCategoryPage';
import Support from './pages/Support';
import PaymentMethod from './pages/PaymentMethod';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SKUManager from './pages/admin/SKUManager';
import VendorManager from './pages/admin/VendorManager';
import CategoryManager from './pages/admin/CategoryManager';
import SubCategoryManager from './pages/admin/SubCategoryManager';
import UnitManager from './pages/admin/UnitManager';
import BrandManager from './pages/admin/BrandManager';
import SubVariantTitleManager from './pages/admin/SubVariantTitleManager';
import DeliveryTimeManager from './pages/admin/DeliveryTimeManager';
import PickingQueue from './pages/admin/PickingQueue';
import FleetManager from './pages/admin/FleetManager';
import InvoicingReports from './pages/admin/InvoicingReports';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import TaskVerification from './pages/driver/TaskVerification';
import DeliveryNavigation from './pages/driver/DeliveryNavigation';
import ProofOfDelivery from './pages/driver/ProofOfDelivery';

// Other
import VendorDashboard from './pages/VendorDashboard';
import Navbar from './components/Navbar';
import AdminSidebar from './components/admin/AdminSidebar';
import { customerSocket, vendorSocket, connectSocket } from './socket';
import './App.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <button 
        className="admin-sidebar-toggle" 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>
      <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="admin-content-area">
        <Outlet />
      </div>
    </div>
  );
};

const SocketManager = () => {
  const location = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Connect Customer Socket
    connectSocket(customerSocket);
    
    // Remove existing listeners to avoid duplicates
    customerSocket.off('order-status-update');
    customerSocket.on('order-status-update', (data: any) => {
      toast.success(`Order Update: ${data.status.replace(/-/g, ' ').toUpperCase()}`, {
        icon: '📋',
        duration: 5000,
        position: 'bottom-right'
      });
    });

    // Connect Vendor Socket if applicable
    if (user.role === 'Vendor') {
      connectSocket(vendorSocket);
      vendorSocket.off('new-order');
      vendorSocket.on('new-order', (order: any) => {
        toast.success(`NEW PROCUREMENT REQUEST! #BID-${order._id.slice(-6).toUpperCase()}`, {
          icon: '📦',
          duration: 10000,
          position: 'top-center',
          style: { background: '#0f172a', color: '#fff', border: '1px solid #f59e0b', padding: '16px', fontWeight: 'bold' }
        });
      });
    }
  }, [location.pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <CartProvider>
        <div className="app-container">
          <Toaster position="top-right" reverseOrder={false} />
          <SocketManager />
          <Navbar />
          <Routes>
            {/* Prioritize specific routes */}
            <Route path="/search" element={<SearchFilter />} />
            
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/category/:id" element={<SubCategoryPage />} />
            <Route path="/brand/:brandName" element={<BrandStore />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<PaymentMethod />} />
            <Route path="/tracking/:id" element={<Tracking />} />
            <Route path="/vendor/:id" element={<VendorStore />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/support" element={<Support />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="inventory" element={<SKUManager />} />
              <Route path="vendors" element={<VendorManager />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="sub-categories" element={<SubCategoryManager />} />
              <Route path="units" element={<UnitManager />} />
              <Route path="brands" element={<BrandManager />} />
              <Route path="variant-titles" element={<SubVariantTitleManager />} />
              <Route path="delivery-times" element={<DeliveryTimeManager />} />
              <Route path="queue" element={<PickingQueue />} />
              <Route path="fleet" element={<FleetManager />} />
              <Route path="invoices" element={<InvoicingReports />} />
            </Route>

            {/* Driver Routes */}
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/verify/:id" element={<TaskVerification />} />
            <Route path="/driver/delivery/:id" element={<DeliveryNavigation />} />
            <Route path="/driver/pod/:id" element={<ProofOfDelivery />} />

            {/* Vendor Routes */}
            <Route path="/vendor" element={<VendorDashboard />} />
          </Routes>
        </div>
      </CartProvider>
    </Router>
  );
};

export default App;
