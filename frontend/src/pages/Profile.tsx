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
  Trash2,
  FileText,
  X,
  Loader2,
  Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import './profile.css';
import SEO from '../components/SEO';
import LocationModal from '../components/LocationModal';
import { customerSocket } from '../socket';
import { getFullImageUrl } from '../utils/imageUrl';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    totalSaving: 0,
    orderCount: 0,
    avgTime: '45m'
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [onDemandRequests, setOnDemandRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingOnDemand, setLoadingOnDemand] = useState(false);
  const [showOnDemandModal, setShowOnDemandModal] = useState(false);
  const [selectedOnDemand, setSelectedOnDemand] = useState<any>(null);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

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
  
  const fetchUserRequests = async () => {
    try {
      setLoadingRequests(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/user-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRevokeRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this request?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/user-requests/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Request revoked successfully');
      fetchUserRequests();
    } catch (err) {
      toast.error('Failed to revoke request');
    }
  };

  const fetchOnDemandRequests = async () => {
    try {
      setLoadingOnDemand(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/on-demand/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOnDemandRequests(data);
    } catch (err) {
      console.error('Failed to fetch on-demand requests', err);
    } finally {
      setLoadingOnDemand(false);
    }
  };

  const handleRevokeOnDemand = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this inquiry?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/on-demand/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Inquiry revoked successfully');
      setSelectedOnDemand(null);
      fetchOnDemandRequests();
    } catch (err) {
      toast.error('Failed to revoke inquiry');
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

        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));

        const count = ordersData.filter((o: any) => o.status !== 'Cancelled').length;
        const totalSpent = ordersData.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
        
        setStats({
          totalSaving: Math.round(totalSpent * 0.12),
          orderCount: count,
          avgTime: count > 3 ? '24m' : '38m'
        });

      } catch (err: any) {
        console.error('Error initializing profile data:', err);
        if (err.response?.status === 401 || (err.response?.status === 404 && err.response?.data?.message === "User not found")) {
           handleLogout();
        }
      } finally {
      }
    };

    initData();

    const handleOnDemandStatusUpdate = (data: any) => {
      setOnDemandRequests((prev: any[]) => prev.map(req => 
        req._id === data.requestId ? { ...req, status: data.status } : req
      ));
      
      setSelectedOnDemand((prev: any) => 
        (prev && prev._id === data.requestId) ? { ...prev, status: data.status } : prev
      );
    };

    customerSocket.on('on-demand-status-update', handleOnDemandStatusUpdate);

    return () => {
      customerSocket.off('on-demand-status-update', handleOnDemandStatusUpdate);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'MatAll - Home Repair Supplies',
      text: 'Order construction and home repair supplies in 60 minutes with MatAll!',
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

  return (
    <div className="matall-profile-page">
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
            <div className="profile-quick-actions">
               <Link to="/support" className="quick-action-item">
                  <div className="qa-icon-box"><MessageSquare size={24} /></div>
                  <span>Support</span>
               </Link>
               <Link to="/orders" className="quick-action-item">
                  <div className="qa-icon-box"><History size={24} /></div>
                  <span>History</span>
               </Link>
               <div className="quick-action-item" onClick={() => {
                  fetchUserRequests();
                  setShowRequestsModal(true);
               }}>
                  <div className="qa-icon-box"><FileText size={24} /></div>
                  <span>Requests</span>
               </div>
               <div className="quick-action-item" onClick={() => {
                  fetchOnDemandRequests();
                  setShowOnDemandModal(true);
               }}>
                  <div className="qa-icon-box"><Package size={24} /></div>
                  <span>On-Demand</span>
               </div>
               <div className="quick-action-item" onClick={() => setIsAddressModalOpen(true)}>
                  <div className="qa-icon-box"><MapPin size={24} /></div>
                  <span>Address</span>
               </div>
            </div>

            {showRequestsModal && (
              <div className="address-manager-overlay" onClick={() => setShowRequestsModal(false)}>
                <div className="address-manager-drawer" onClick={e => e.stopPropagation()}>
                  <div className="drawer-header">
                    <h3>Material Requests</h3>
                    <button onClick={() => setShowRequestsModal(false)} className="close-drawer-btn">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="requests-list-container">
                    {loadingRequests ? (
                      <div className="loading-requests-state">
                        <Loader2 className="spinner" size={32} />
                        <span>Fetching your requirements...</span>
                      </div>
                    ) : userRequests?.length > 0 ? (
                      userRequests.map((req: any, index: number) => {
                        const statusClass = 
                          req.status === 'Pending' ? 'status-pending' : 
                          req.status === 'Cancelled' ? 'status-cancelled' : 
                          req.status === 'Delivered' ? 'status-delivered' : 'status-default';

                        return (
                          <div key={req._id} className="profile-request-card" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className="req-img-wrapper">
                              <img 
                                src={getFullImageUrl(req.imageUrl)} 
                                alt="Material" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=200';
                                }}
                              />
                            </div>
                            <div className="req-content-main">
                              <div className="req-card-top">
                                <span className="req-date-label">
                                  {new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                                <span className={`req-status-pill ${statusClass}`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="req-title">Material List Request</p>
                              {req.status !== 'Cancelled' && req.status !== 'Delivered' && (
                                <button 
                                  className="revoke-request-btn"
                                  onClick={() => handleRevokeRequest(req._id)}
                                >
                                  <Trash2 size={14} /> Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-address-state">
                        <div className="addr-icon-bg" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
                          <FileText size={32} />
                        </div>
                        <p style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>No material requests yet</p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '200px' }}>
                          Upload site notes or handwritten lists via AI Search
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showOnDemandModal && (
              <div className="address-manager-overlay" onClick={() => setShowOnDemandModal(false)}>
                <div className="address-manager-drawer" onClick={e => e.stopPropagation()}>
                  <div className="drawer-header">
                    <h3>On-Demand Quotes</h3>
                    <button onClick={() => setShowOnDemandModal(false)} className="close-drawer-btn">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="requests-list-container">
                    {loadingOnDemand ? (
                      <div className="loading-requests-state">
                        <Loader2 className="spinner" size={32} />
                        <span>Fetching your quotes...</span>
                      </div>
                    ) : onDemandRequests?.length > 0 ? (
                      onDemandRequests.map((req: any, index: number) => {
                        const statusClass = 
                          req.status === 'Pending' ? 'status-pending' : 
                          req.status === 'Cancelled' ? 'status-cancelled' : 
                          req.status === 'Quoted' ? 'status-delivered' : 
                          req.status === 'Ordered' ? 'status-delivered' : 'status-default';

                        return (
                          <div 
                            key={req._id} 
                            className="profile-request-card" 
                            style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer' }}
                            onClick={() => setSelectedOnDemand(req)}
                          >
                            <div className="req-img-wrapper">
                              <img 
                                src={getFullImageUrl(req.productId?.imageUrl)} 
                                alt="Product" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=200';
                                }}
                              />
                            </div>
                            <div className="req-content-main">
                              <div className="req-card-top">
                                <span className="req-date-label">
                                  {new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                                <span className={`req-status-pill ${statusClass}`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="req-title" style={{ fontSize: '0.9rem', marginBottom: '2px' }}>{req.productName}</p>
                              {req.variantName && req.variantName !== 'Standard' && (
                                <p className="req-subtitle" style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>{req.variantName}</p>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>Qty: {req.quantity}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Req: {req.requiredBy}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-address-state">
                        <div className="addr-icon-bg" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
                          <Package size={32} />
                        </div>
                        <p style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>No on-demand quotes yet</p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '200px' }}>
                          Requests for non-standard products will appear here
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedOnDemand && (
              <div className="address-manager-overlay" style={{ zIndex: 2100 }} onClick={() => setSelectedOnDemand(null)}>
                <div className="address-manager-drawer" onClick={e => e.stopPropagation()}>
                  <div className="drawer-header">
                    <h3>Inquiry Details</h3>
                    <button onClick={() => setSelectedOnDemand(null)} className="close-drawer-btn">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="drawer-scroll-content" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    <div className="od-detail-hero" style={{ textAlign: 'center', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '20px' }}>
                      <div className="od-detail-img" style={{ width: '100px', height: '100px', margin: '0 auto 1rem', borderRadius: '15px', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <img 
                          src={getFullImageUrl(selectedOnDemand.productId?.imageUrl)} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=200'; }}
                        />
                      </div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900 }}>{selectedOnDemand.productName}</h4>
                      <span className={`status-badge-inline ${selectedOnDemand.status.toLowerCase()}`} style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '4px 12px', borderRadius: '100px', background: '#000', color: '#fff' }}>
                        {selectedOnDemand.status}
                      </span>
                    </div>

                    <div className="od-detail-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="od-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>Quantity</span>
                        <span style={{ fontWeight: 800 }}>{selectedOnDemand.quantity} Units</span>
                      </div>
                      <div className="od-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>Required By</span>
                        <span style={{ fontWeight: 800 }}>{selectedOnDemand.requiredBy}</span>
                      </div>
                      <div className="od-info-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 0' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>Project Address</span>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{selectedOnDemand.address || 'Standard Location'}</p>
                      </div>

                      {['Pending', 'Quoted'].includes(selectedOnDemand.status) && (
                        <button 
                          className="revoke-request-btn"
                          style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', padding: '12px' }}
                          onClick={() => handleRevokeOnDemand(selectedOnDemand._id)}
                        >
                          <Trash2 size={16} /> Revoke Inquiry
                        </button>
                      )}
                    </div>

                    <div className="od-timeline-simple" style={{ marginTop: '2rem', padding: '1rem', border: '1.5px solid #f1f5f9', borderRadius: '15px' }}>
                      <h5 style={{ margin: '0 0 1rem 0', fontWeight: 800 }}>Request Progress</h5>
                      <div className="timeline-steps" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="t-step active" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                           <div className="t-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                           <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Requirement Placed</span>
                        </div>
                        <div className={`t-step ${['Quoted', 'Ordered', 'Delivered'].includes(selectedOnDemand.status) ? 'active' : ''}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: ['Quoted', 'Ordered', 'Delivered'].includes(selectedOnDemand.status) ? 1 : 0.4 }}>
                           <div className="t-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                           <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Quote shared by MatAll</span>
                        </div>
                        <div className={`t-step ${['Ordered', 'Delivered'].includes(selectedOnDemand.status) ? 'active' : ''}`} style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: ['Ordered', 'Delivered'].includes(selectedOnDemand.status) ? 1 : 0.4 }}>
                           <div className="t-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                           <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Dispatch Confirmed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isAddressModalOpen && (
              <div className="address-manager-overlay" onClick={() => setIsAddressModalOpen(false)}>
                <div className="address-manager-drawer" onClick={e => e.stopPropagation()}>
                  <div className="drawer-header">
                    <h3>Your Saved Addresses</h3>
                    <button onClick={() => setIsAddressModalOpen(false)} className="close-drawer-btn">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="saved-addresses-list">
                    {user.jobsites?.length > 0 ? (
                      user.jobsites.map((addr: any, idx: number) => (
                        <div key={idx} className="profile-addr-card">
                          <div className="addr-icon-bg">
                            {addr.addressType === 'Home' ? <History size={20} /> : <MapPin size={20} />}
                          </div>
                          <div className="addr-info-main">
                            <span className="addr-nickname">{addr.name}</span>
                            <p className="addr-text-full">{addr.addressText}</p>
                            {addr.contactPhone && <span className="addr-phone">Ph: {addr.contactPhone}</span>}
                          </div>
                          <div className="addr-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button className="edit-addr-btn" onClick={() => {
                              setAddressToEdit(addr);
                              setEditIndex(idx);
                              setIsAddressModalOpen(false);
                              setShowLocationModal(true);
                            }} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', color: '#64748b' }}>
                              <Pencil size={18} />
                            </button>
                            <button className="delete-addr-btn" onClick={() => handleDeleteAddress(idx)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-address-state">
                        <div className="addr-icon-bg" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
                          <MapPin size={32} />
                        </div>
                        <p style={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>No addresses saved yet</p>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', maxWidth: '200px' }}>
                          Add your home, office or site address for faster delivery
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="drawer-footer-actions">
                    <button className="add-address-full-btn" onClick={() => {
                        setIsAddressModalOpen(false);
                        setShowLocationModal(true);
                      }}>
                      + Add New Address
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            <div className="profile-list-options">
               <div className="list-option-row" onClick={handleShare}>
                  <div className="opt-label-box">
                     <Share2 size={20} />
                     <span>Share the App</span>
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

        <LocationModal 
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setAddressToEdit(null);
            setEditIndex(null);
          }}
          onSelectAddress={() => {
            refreshUser();
            setShowLocationModal(false);
            setAddressToEdit(null);
            setEditIndex(null);
          }}
          initialData={addressToEdit}
          editIndex={editIndex}
        />
      </main>
    </div>
  );
};

export default Profile;
