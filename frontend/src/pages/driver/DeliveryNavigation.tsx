import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Clock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const DeliveryNavigation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/orders/${id}`);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="content">Initializing Navigation...</div>;

  return (
    <main className="content delivery-navigation" style={{ padding: 0, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div className="nav-map-container" style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[12.9716, 77.5946]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[12.9716, 77.5946]}>
            <Popup>Current Location</Popup>
          </Marker>
          <Marker position={[12.9816, 77.6046]}>
            <Popup>Jobsite: {order.deliveryAddress?.name}</Popup>
          </Marker>
        </MapContainer>

        <div className="map-overlay-top" style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem' }}>
            <div style={{ background: '#2563eb', color: 'white', padding: '10px', borderRadius: '12px' }}><Navigation size={24} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Turn Right into Service Road</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Then 200m to Site Entrance B</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>12 min</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>3.4 km</div>
            </div>
          </div>
        </div>
      </div>

      <div className="delivery-status-panel card" style={{ borderRadius: '24px 24px 0 0', margin: 0, padding: '1.5rem', boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{order.deliveryAddress?.name || 'Project Alpha Site'}</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Standard Delivery | #BID-{id?.slice(-6).toUpperCase()}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="icon-btn" style={{ background: '#eff6ff', color: '#2563eb' }}><Phone size={20} /></button>
            <button className="icon-btn" style={{ background: '#f5f3ff', color: '#7c3aed' }} onClick={() => setShowChat(true)}><MessageSquare size={20} /></button>
          </div>
        </div>

        <div className="site-instructions" style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>Safety Instructions</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Wear hard hat at all times. Park at Gate 4. Contact Foreman Sunil on arrival.</p>
        </div>

        <button 
          onClick={() => navigate(`/driver/pod/${id}`)}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          ARRIVED AT SITE <ChevronRight size={20} />
        </button>
      </div>

      {showChat && (
        <div className="chat-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="chat-window card" style={{ width: '100%', height: '80vh', borderRadius: '24px 24px 0 0', margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="chat-header" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <h3>Chat with Contractor</h3>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', fontWeight: 800 }}>CLOSE</button>
            </div>
            <div className="chat-messages" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              <div className="msg system" style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', margin: '1rem 0' }}>Chat started for Order #BID-{id?.slice(-6).toUpperCase()}</div>
              <div className="msg received" style={{ background: '#f1f5f9', padding: '10px 15px', borderRadius: '12px 12px 12px 0', maxWidth: '80%', marginBottom: '1rem' }}>
                Hey, are you near the gate? The crane is ready for the steel.
              </div>
            </div>
            <div className="chat-input" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Type a message..." style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              <button style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 700 }}>SEND</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DeliveryNavigation;
