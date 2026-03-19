import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  Truck, 
  Store, 
  UserCircle,
  Mail,
  Calendar,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        toast.error('Session expired. Please login again.');
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="content">Loading profile...</div>;

  return (
    <main className="content profile-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ width: '120px', height: '120px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <UserCircle size={80} />
          </div>
          <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#16a34a', color: 'white', padding: '4px', borderRadius: '50%', border: '2px solid white' }}>
            <ShieldCheck size={16} />
          </div>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '1.5rem', marginBottom: '0.5rem' }}>{user.fullName}</h1>
        <div style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 800, display: 'inline-block' }}>
          {user.role.toUpperCase()} ACCOUNT
        </div>
      </header>

      <div className="profile-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--primary-dark)" /> Personal Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="info-item">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <div style={{ fontWeight: 600 }}>{user.fullName}</div>
            </div>
            <div className="info-item">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Phone Number</label>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} /> +91 {user.phoneNumber}
              </div>
            </div>
            <div className="info-item">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Verification Status</label>
              <div style={{ fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Verified Professional
              </div>
            </div>
            <div className="info-item">
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Member Since</label>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} /> {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </section>

        {user.role === 'Buyer' && (
          <section className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} color="var(--primary)" /> BuildItQuick Pay
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Available Procurement Credit</span>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem' }}>₹50,000.00</div>
              </div>
              <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                View Billing
              </button>
            </div>
          </section>
        )}

        {(user.role === 'Driver' || user.role === 'Vendor') && (
          <section className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.role === 'Driver' ? <Truck size={20} /> : <Store size={20} />} Professional Details
            </h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              {user.role === 'Driver' && (
                <>
                  <div className="info-item">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Vehicle Class</label>
                    <div style={{ fontWeight: 600 }}>{user.vehicleType}</div>
                  </div>
                  <div className="info-item">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Live Status</label>
                    <div style={{ fontWeight: 600, color: user.isOnline ? '#16a34a' : '#ef4444' }}>{user.isOnline ? 'Online' : 'Offline'}</div>
                  </div>
                </>
              )}
              {user.role === 'Vendor' && (
                <div className="info-item">
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Associated Vendor ID</label>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{user.vendorId}</div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="profile-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
              <MapPin size={18} color="#64748b" /> Saved Jobsite Addresses
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
          <button className="card" style={{ padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
              <Mail size={18} color="#64748b" /> Notification Preferences
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
        </section>
      </div>
    </main>
  );
};

export default Profile;
