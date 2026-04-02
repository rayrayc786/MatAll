import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList,
  FileBarChart,
  LogOut,
  X,
  Users,
  ShoppingBag,
  Package,
  Layers,
  Award,
  Tag,
  MapPin,
  Image,
  Percent,
  Link,
  ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    {
      title: 'CORE',
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin?tab=dashboard' },
        { icon: <FileBarChart size={18} />, label: 'Statistics', path: '/admin?tab=reports' },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { icon: <ShoppingBag size={18} />, label: 'Orders', path: '/admin?tab=actions&sub=orders' },
        { icon: <Users size={18} />, label: 'Users', path: '/admin?tab=actions&sub=users' },
        { icon: <Image size={18} />, label: 'User Material Requests', path: '/admin?tab=actions&sub=userRequests' },
        // { icon: <ClipboardList size={18} />, label: 'Support Tickets', path: '/admin?tab=actions&sub=tickets' },
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { icon: <Package size={18} />, label: 'SKU Manager', path: '/admin/inventory' },
        { icon: <Layers size={18} />, label: 'Categories', path: '/admin/categories' },
        { icon: <Award size={18} />, label: 'Brands', path: '/admin/brands' },
        { icon: <Percent size={18} />, label: 'GST Settings', path: '/admin?tab=actions&sub=gst' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { icon: <Tag size={18} />, label: 'Offers & Banners', path: '/admin/offers' },
        { icon: <MapPin size={18} />, label: 'Service Areas', path: '/admin/locations' },
        { icon: <Link size={18} />, label: 'Footer Links', path: '/admin?tab=actions&sub=footer-links' },
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      if (onClose) onClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname + location.search === path;
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="admin-badge-container">
          <span className="admin-badge">ADMIN PANEL</span>
          <div className="online-indicator"></div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-scroll">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-section">
            <h3 className="section-title">{section.title}</h3>
            <nav className="sidebar-nav">
              {section.items.map((item, iIdx) => (
                <NavLink 
                  key={iIdx} 
                  to={item.path} 
                  className={() => `nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <div className="nav-item-content">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive(item.path) && <ChevronRight size={14} className="active-arrow" />}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <div className="logout-content">
            <div className="logout-icon-bg">
              <LogOut size={18} />
            </div>
            <div className="logout-text">
               <span className="primary">Logout</span>
               <span className="secondary">Exit Panel</span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
