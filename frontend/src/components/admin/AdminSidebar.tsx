import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
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
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin?tab=dashboard' },
    { icon: <FileBarChart size={20} />, label: 'Reports', path: '/admin?tab=reports' },
    { icon: <ClipboardList size={20} />, label: 'Actions', path: '/admin?tab=actions' },
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
