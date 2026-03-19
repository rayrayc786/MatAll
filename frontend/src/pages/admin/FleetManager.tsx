import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, User, MapPin } from 'lucide-react';
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

const FleetManager: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/fleet`);
      setDrivers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="content">Loading fleet status...</div>;

  return (
    <main className="content fleet-manager">
      <header className="admin-header space-between">
        <div className="title-group">
          <h1>Fleet & Carrier Manager</h1>
          <p>Live GPS tracking & load status of active delivery partners</p>
        </div>
        <div className="quick-stats">
          <span>{drivers.filter(d => d.isOnline).length} Online</span> | 
          <span> {drivers.length} Total Registered</span>
        </div>
      </header>

      <div className="fleet-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <section className="fleet-list card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <div className="list-header" style={{ marginBottom: '15px' }}>
            <h3>Active Carriers</h3>
          </div>
          <div className="carrier-list">
            {drivers.map(driver => (
              <div key={driver._id} className="carrier-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #eee' }}>
                <div className="carrier-icon"><User size={20} /></div>
                <div className="carrier-info" style={{ flex: 1 }}>
                  <strong>{driver.fullName}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {driver.vehicleType} | {driver.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className={`status-pill ${driver.isOnline ? 'online' : 'offline'}`} 
                     style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', background: driver.isOnline ? '#dcfce7' : '#f3f4f6' }}>
                  {driver.isOnline ? 'ACTIVE' : 'IDLE'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fleet-map card" style={{ height: '600px', overflow: 'hidden' }}>
          <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {drivers.filter(d => d.currentLocation).map(driver => (
              <Marker 
                key={driver._id} 
                position={[driver.currentLocation.coordinates[1], driver.currentLocation.coordinates[0]]} 
                icon={driver.vehicleType === 'Scooter' ? bikeIcon : truckIcon}
              >
                <Popup>
                  <strong>{driver.fullName}</strong><br />
                  Vehicle: {driver.vehicleType}<br />
                  Phone: {driver.phoneNumber}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </section>
      </div>
    </main>
  );
};

export default FleetManager;
