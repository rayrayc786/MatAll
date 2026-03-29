import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';

// Custom Marker Icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [24, 24],
});
const bikeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965319.png',
  iconSize: [24, 24],
});

const RiderManager: React.FC = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/riders`);
      setRiders(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRiders();
    const interval = setInterval(fetchRiders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="content">Loading rider status...</div>;

  return (
    <main className="content rider-manager">
      <header className="admin-header space-between">
        <div className="title-group">
          <h1>Rider & Logistic Manager</h1>
          <p>Live GPS tracking & load status of active delivery partners</p>
        </div>
        <div className="quick-stats">
          <span>{riders.filter(r => r.isOnline).length} Online</span> | 
          <span> {riders.length} Total Registered</span>
        </div>
      </header>

      <div className="rider-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <section className="rider-list card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <div className="list-header" style={{ marginBottom: '15px' }}>
            <h3>Active Riders</h3>
          </div>
          <div className="rider-list">
            {riders.map(rider => (
              <div key={rider._id} className="rider-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #eee' }}>
                <div className="rider-icon"><User size={20} /></div>
                <div className="rider-info" style={{ flex: 1 }}>
                  <strong>{rider.fullName}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {rider.vehicleType} | {rider.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className={`status-pill ${rider.isOnline ? 'online' : 'offline'}`} 
                     style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', background: rider.isOnline ? '#dcfce7' : '#f3f4f6' }}>
                  {rider.isOnline ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rider-map card" style={{ height: '600px', overflow: 'hidden' }}>
          <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {riders.filter(r => r.currentLocation).map(rider => (
              <Marker 
                key={rider._id} 
                position={[rider.currentLocation.coordinates[1], rider.currentLocation.coordinates[0]]} 
                icon={rider.vehicleType === 'Scooter' ? bikeIcon : truckIcon}
              >
                <Popup>
                  <strong>{rider.fullName}</strong><br />
                  Vehicle: {rider.vehicleType}<br />
                  Phone: {rider.phoneNumber}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>
      </div>
    </main>
  );
};

export default RiderManager;
