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
  ChevronRight,
  LogOut,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './profile.css';
import SEO from '../components/SEO';
import LocationModal from '../components/LocationModal';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    totalSaving: 0,
    orderCount: 0,
    avgTime: '45m'
  });
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const handleDeleteAddress = async (index: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const updatedJobsites = user.jobsites.filter((_: any, i: number) => i !== index);
      
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
        { jobsites: updatedJobsites },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // Parallelize profile and order fetching
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const profileData = profileRes.data;
        const ordersData = ordersRes.data;

        // Update User State
        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));

        // Calculate Stats from orders
        const count = ordersData.filter((o: any) => o.status !== 'Cancelled').length;
        const totalSpent = ordersData.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
        
        // Dynamic stats
        setStats({
          totalSaving: Math.round(totalSpent * 0.12), // Estimate 12% savings
          orderCount: count,
          avgTime: count > 3 ? '24m' : '38m' // Show faster time for loyal users
        });

      } catch (err: any) {
        console.error('Error initializing profile data:', err);
        if (err.response?.status === 401 || (err.response?.status === 404 && err.response?.data?.message === "User not found")) {
           handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'MatAll - Home Repair Supplies',
      text: 'Order construction and home repair supplies in 10 minutes with MatAll!',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };


  if (loading && stats.orderCount === 0) {
      // Just a subtle indicator, or no-op if flash is fast
  }

  return (
    <div className="blinkit-profile-page">
      <SEO title="My Profile" description="Manage your account, view savings, and check your order history on MatAll." />
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
               <div className="quick-action-item" onClick={() => setIsAddressModalOpen(true)}>
                  <div className="qa-icon-box"><MapPin size={24} /></div>
                  <span>Address</span>
               </div>
            </div>

            {/* Address Management Drawer */}
            {isAddressModalOpen && (
              <div className="address-manager-overlay" onClick={() => setIsAddressModalOpen(false)}>
                <div className="address-manager-drawer" onClick={e => e.stopPropagation()}>
                  <div className="drawer-header">
                    <h3>Manage Addresses</h3>
                    <button onClick={() => setIsAddressModalOpen(false)} className="close-drawer-btn">
                      <ChevronRight size={24} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                  </div>
                  
                  <div className="saved-addresses-list">
                    {user.jobsites?.length > 0 ? (
                      user.jobsites.map((site: any, idx: number) => (
                        <div key={idx} className="profile-addr-card">
                          <div className="addr-icon-bg">
                            <MapPin size={20} />
                          </div>
                          <div className="addr-info-main">
                            <span className="addr-nickname">{site.name || site.addressType}</span>
                            <p className="addr-text-full">{site.addressText}</p>
                          </div>
                          <button 
                            className="delete-addr-btn"
                            onClick={() => handleDeleteAddress(idx)}
                            title="Delete Address"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-address-state">
                        <MapPin size={48} color="#e2e8f0" />
                        <p>No addresses saved yet</p>
                      </div>
                    )}
                  </div>

                  <button 
                    className="add-address-full-btn"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      setShowLocationModal(true);
                    }}
                  >
                    + Add New Address
                  </button>
                </div>
              </div>
            )}

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
               <div className="list-option-row" onClick={handleShare}>
                  <div className="opt-label-box">
                     <Share2 size={20} />
                     <span>Share the App</span>
                  </div>
                  <ChevronRight size={20} />
               </div>
               {/* <div className="list-option-row" onClick={() => handleAction('GST Details')}>
                  <div className="opt-label-box">
                     <FileText size={20} />
                     <span>Fetch GST Details</span>
                  </div>
                  <ChevronRight size={20} />
               </div> */}
               
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

        <LocationModal 
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelectAddress={() => {
            // Address is already saved to DB inside LocationModal.tsx handleAddAddress
            // We just need to refresh local user state
            refreshUser();
            setShowLocationModal(false);
          }}
        />
      </main>
    </div>
  );
};

export default Profile;
