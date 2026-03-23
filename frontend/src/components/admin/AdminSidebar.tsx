import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Store,
  Tag,
  Layers,
  Ruler,
  Award,
  Type,
  Clock,
  ClipboardList, 
  Truck, 
  FileBarChart,
  LogOut,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <Package size={20} />, label: 'SKU Manager', path: '/admin/inventory' },
    { icon: <Store size={20} />, label: 'Manage Vendors', path: '/admin/vendors' },
    { icon: <Tag size={20} />, label: 'Categories', path: '/admin/categories' },
    { icon: <Layers size={20} />, label: 'Sub-Categories', path: '/admin/sub-categories' },
    { icon: <Award size={20} />, label: 'Brands', path: '/admin/brands' },
    { icon: <Type size={20} />, label: 'Attribute Titles', path: '/admin/variant-titles' },
    { icon: <Ruler size={20} />, label: 'Units', path: '/admin/units' },
    { icon: <Clock size={20} />, label: 'Delivery Times', path: '/admin/delivery-times' },
    { icon: <ClipboardList size={20} />, label: 'Picking Queue', path: '/admin/queue' },
    { icon: <Truck size={20} />, label: 'Fleet Manager', path: '/admin/fleet' },
    { icon: <FileBarChart size={20} />, label: 'Reports', path: '/admin/invoices' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="admin-badge">ADMIN PANEL</span>
        <button className="sidebar-close-btn" onClick={onClose} style={{ display: 'none', background: 'none', border: 'none', color: 'white' }}>
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            end={item.path === '/admin'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
        <button className="nav-item logout" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
