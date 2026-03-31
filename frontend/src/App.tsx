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
import SupplierStore from './pages/SupplierStore';
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
import SupplierManager from './pages/admin/SupplierManager';
import CategoryManager from './pages/admin/CategoryManager';
import SubCategoryManager from './pages/admin/SubCategoryManager';
import UnitManager from './pages/admin/UnitManager';
import BrandManager from './pages/admin/BrandManager';
import SubVariantTitleManager from './pages/admin/SubVariantTitleManager';
import DeliveryTimeManager from './pages/admin/DeliveryTimeManager';
import PickingQueue from './pages/admin/PickingQueue';
import RiderManager from './pages/admin/RiderManager';
import InvoicingReports from './pages/admin/InvoicingReports';
import OfferManager from './pages/admin/OfferManager';

// Rider Pages
import RiderDashboard from './pages/rider/RiderDashboard';
import TaskVerification from './pages/rider/TaskVerification';
import DeliveryNavigation from './pages/rider/DeliveryNavigation';
import ProofOfDelivery from './pages/rider/ProofOfDelivery';

// Other
import Reports from './pages/Reports';
import SupplierDashboard from './pages/SupplierDashboard';
import Navbar from './components/Navbar';
import AdminSidebar from './components/admin/AdminSidebar';
// import FloatingCart from './components/FloatingCart';
import { customerSocket, supplierSocket, connectSocket } from './socket';
import './App.css';
import './responsive.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/admin';

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''} ${isDashboard ? 'on-dashboard' : ''}`}>
      {!isDashboard && (
        <button 
          className="admin-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={20} />
        </button>
      )}
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
    
    // Role-based Socket Connection Management
    if (!user.role || user.role === 'End User' || user.role === 'Rider') {
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
    }

    if (user.role === 'Supplier') {
      connectSocket(supplierSocket);
      supplierSocket.off('new-order');
      supplierSocket.on('new-order', (order: any) => {
        toast.success(`NEW PROCUREMENT REQUEST! #BID-${order._id.slice(-6).toUpperCase()}`, {
          icon: '📦',
          duration: 10000,
          position: 'top-center',
          style: { background: '#0f172a', color: '#fff', border: '1px solid #f59e0b', padding: '16px', fontWeight: 'bold' }
        });
      });
    }
    
    // Admin socket is uniquely managed inside AdminDashboard.tsx to handle local component state refreshes.
  }, [location.pathname]);

  return null;
};

import Footer from './components/Footer';
import SiteFooter from './components/SiteFooter';

const AppContent = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isRiderPath = location.pathname.startsWith('/rider');
  const isSupplierPath = location.pathname.startsWith('/supplier') || location.pathname === '/reports';
  const isLoginPage = location.pathname === '/login';

  const isCartPath = location.pathname === '/cart';
  const isCheckoutPath = location.pathname === '/checkout';
  const isPaymentPath = location.pathname === '/payment';

  const showNavbar = !isAdminPath && !isRiderPath && !isSupplierPath && !isLoginPage && !isPaymentPath;
  const showSiteFooter = !isAdminPath && !isRiderPath && !isSupplierPath && !isLoginPage && !isCartPath && !isCheckoutPath && !isPaymentPath;
  const showBottomNav = !isAdminPath && !isRiderPath && !isSupplierPath && !isPaymentPath;

  return (
    <div className={`app-container app-container-responsive ${showBottomNav ? 'with-footer-padding' : ''}`}>
      <Toaster position="top-right" reverseOrder={false} />
      <SocketManager />
      {showNavbar && <Navbar />}
      {/* <FloatingCart /> */}
      <Routes>
        {/* Prioritize specific routes */}
        <Route path="/search" element={<SearchFilter />} />
        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/category/:categoryName" element={<SubCategoryPage />} />
        <Route path="/brand/:brandName" element={<BrandStore />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<PaymentMethod />} />
        <Route path="/tracking/:id" element={<Tracking />} />
        <Route path="/supplier/:id" element={<SupplierStore />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/support" element={<Support />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="inventory" element={<SKUManager />} />
          <Route path="suppliers" element={<SupplierManager />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="sub-categories" element={<SubCategoryManager />} />
          <Route path="units" element={<UnitManager />} />
          <Route path="brands" element={<BrandManager />} />
          <Route path="variant-titles" element={<SubVariantTitleManager />} />
          <Route path="delivery-times" element={<DeliveryTimeManager />} />
          <Route path="queue" element={<PickingQueue />} />
          <Route path="fleet" element={<RiderManager />} />
          <Route path="invoices" element={<InvoicingReports />} />
          <Route path="offers" element={<OfferManager />} />
        </Route>

        {/* Rider Routes */}
        <Route path="/rider" element={<RiderDashboard />} />
        <Route path="/rider/verify/:id" element={<TaskVerification />} />
        <Route path="/rider/delivery/:id" element={<DeliveryNavigation />} />
        <Route path="/rider/pod/:id" element={<ProofOfDelivery />} />

        {/* Supplier Routes */}
        <Route path="/supplier" element={<SupplierDashboard />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>

      {showSiteFooter && <SiteFooter />}
      {showBottomNav && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
};

export default App;
