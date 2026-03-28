import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MessageSquare, 
  History, 
  MapPin, 
  Users, 
  TrendingUp, 
  Package, 
  Clock, 
  Share2, 
  FileText, 
  Bug,
  ChevronRight,
  LogOut
} from 'lucide-react';
import './profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="blinkit-profile-page">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="profile-user-info">
           <h2>Your Account</h2>
           <span>{user.fullName || 'Guest User'}</span>
           <p>+91 {user.phoneNumber || 'XXXXXXXXXX'}</p>
        </div>
      </header>

      <main className="profile-content main-content-responsive">
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
           <div className="quick-action-item">
              <div className="qa-icon-box"><MapPin size={24} /></div>
              <span>Address</span>
           </div>
        </div>

        {/* Team Management (B2B) */}
        {/* {user.role === 'Buyer' && (
          <section className="profile-section-tile team-tile">
             <div className="section-header-row">
                <Users size={20} />
                <h3>Team Management</h3>
             </div>
             <div className="team-members-row">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="member-circle">
                     <User size={18} />
                     <span>Team {i}</span>
                  </div>
                ))}
             </div>
          </section>
        )} */}

        {/* Business Insights (Basic MIS) */}
        <section className="profile-section-tile insights-tile">
           <div className="insights-grid">
              <div className="insight-item">
                 <TrendingUp size={20} color="#10b981" />
                 <div className="insight-data">
                    <strong>₹4,500</strong>
                    <span>Total Saving</span>
                 </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-item">
                 <Package size={20} color="#3b82f6" />
                 <div className="insight-data">
                    <strong>12</strong>
                    <span>Orders</span>
                 </div>
              </div>
              <div className="insight-divider"></div>
              <div className="insight-item">
                 <Clock size={20} color="#f59e0b" />
                 <div className="insight-data">
                    <strong>45m</strong>
                    <span>Avg. Time</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Additional Options */}
        <div className="profile-list-options">
           <div className="list-option-row">
              <div className="opt-label-box">
                 <Share2 size={20} />
                 <span>Share the App</span>
              </div>
              <ChevronRight size={20} />
           </div>
           <div className="list-option-row">
              <div className="opt-label-box">
                 <FileText size={20} />
                 <span>Fetch GST Details</span>
              </div>
              <ChevronRight size={20} />
           </div>
           <div className="list-option-row">
              <div className="opt-label-box">
                 <Bug size={20} />
                 <span>Report Bug or Suggest Feature</span>
              </div>
              <ChevronRight size={20} />
           </div>
           <div className="list-option-row logout" onClick={handleLogout}>
              <div className="opt-label-box">
                 <LogOut size={20} />
                 <span>Logout</span>
              </div>
              <ChevronRight size={20} />
           </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
