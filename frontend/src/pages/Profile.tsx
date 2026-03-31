import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  MessageSquare, 
  History, 
  MapPin, 
  TrendingUp, 
  Package, 
  Clock, 
  Share2, 
  FileText, 
  Bug,
  ChevronRight,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import './profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    totalSaving: 0,
    orderCount: 0,
    avgTime: '45m'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // Fetch real orders to calculate stats
        const { data: orders } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Calculate stats
        const count = orders.length;
        // Mock saving calculation: total amount spent * 0.12 (12% saving)
        const totalSpent = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        const saving = Math.round(totalSpent * 0.12);

        setStats({
          totalSaving: saving || 0,
          orderCount: count || 0,
          avgTime: count > 3 ? '28m' : '45m'
        });

      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        if (err.response?.status === 401) {
           handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleAction = (label: string) => {
    toast(label + ' feature coming soon!', { icon: '🚧' });
  };

  if (loading && stats.orderCount === 0) {
      // Just a subtle indicator, or no-op if flash is fast
  }

  return (
    <div className="blinkit-profile-page">
      <main className="profile-content">
        <div className="profile-inner-container">
          <header className="profile-header-new">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={22} />
            </button>
            <div className="profile-user-info">
              <h2>Your Account</h2>
              <div className="user-details-box">
                 <span className="user-name">{user.fullName || 'New User'}</span>
                 <p className="user-phone">{user.phoneNumber ? `+91 ${user.phoneNumber}` : '+91 8888888888'}</p>
              </div>
            </div>
          </header>

          <div className="profile-scroll-area">
            {/* Quick Access Icons */}
            <div className="profile-quick-actions">
               <Link to="/support" className="quick-action-item">
                  <div className="qa-icon-box"><MessageSquare size={24} /></div>
                  <span>Support</span>
               </Link>
               <Link to="/orders" className="quick-action-item">
                  <div className="qa-icon-box"><History size={24} /></div>
                  <span>History</span>
               </Link>
               <div className="quick-action-item" onClick={() => handleAction('Manage Address')}>
                  <div className="qa-icon-box"><MapPin size={24} /></div>
                  <span>Address</span>
               </div>
            </div>

            {/* Business Insights (Basic MIS) */}
            <section className="profile-section-tile insights-tile">
               <div className="insights-grid">
                  <div className="insight-item">
                     <TrendingUp size={20} color="#10b981" />
                     <div className="insight-data">
                        <strong>₹{stats.totalSaving.toLocaleString('en-IN')}</strong>
                        <span>Total Saving</span>
                     </div>
                  </div>
                  <div className="insight-divider"></div>
                  <div className="insight-item">
                     <Package size={20} color="#3b82f6" />
                     <div className="insight-data">
                        <strong>{stats.orderCount}</strong>
                        <span>Orders</span>
                     </div>
                  </div>
                  <div className="insight-divider"></div>
                  <div className="insight-item">
                     <Clock size={20} color="#f59e0b" />
                     <div className="insight-data">
                        <strong>{stats.avgTime}</strong>
                        <span>Avg. Time</span>
                     </div>
                  </div>
               </div>
            </section>

            {/* Additional Options */}
            <div className="profile-list-options">
               <div className="list-option-row" onClick={() => handleAction('Share')}>
                  <div className="opt-label-box">
                     <Share2 size={20} />
                     <span>Share the App</span>
                  </div>
                  <ChevronRight size={20} />
               </div>
               <div className="list-option-row" onClick={() => handleAction('GST Details')}>
                  <div className="opt-label-box">
                     <FileText size={20} />
                     <span>Fetch GST Details</span>
                  </div>
                  <ChevronRight size={20} />
               </div>
               <div className="list-option-row" onClick={() => handleAction('Report Bug')}>
                  <div className="opt-label-box">
                     <Bug size={20} />
                     <span>Report Bug or Suggest Feature</span>
                  </div>
                  <ChevronRight size={20} />
               </div>
                <div className="list-option-row logout-action" onClick={handleLogout}>
                  <div className="opt-label-box">
                    <LogOut size={20} />
                    <span>Logout</span>
                  </div>
                  <ChevronRight size={18} />
                </div>
            </div> 
          </div> 
        </div>
      </main>
    </div>
  );
};

export default Profile;
