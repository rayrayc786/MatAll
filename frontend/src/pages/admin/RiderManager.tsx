import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, useApiIsLoaded, InfoWindow } from '@vis.gl/react-google-maps';
import { User } from 'lucide-react';
import axios from 'axios';

const truckIcon = 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png';
const bikeIcon = 'https://cdn-icons-png.flaticon.com/512/2965/2965319.png';

const RiderManager: React.FC = () => {
  const isLoaded = useApiIsLoaded();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<any>(null);

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

  const center = { lat: 12.9716, lng: 77.5946 };

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
              <div key={rider._id} className="rider-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setSelectedRider(rider)}>
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
          {isLoaded ? (
            <Map
              style={{ width: '100%', height: '100%' }}
              defaultCenter={center}
              defaultZoom={12}
              mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
            >
              {riders.filter(r => r.currentLocation).map(rider => (
                <AdvancedMarker 
                  key={rider._id} 
                  position={{ lat: rider.currentLocation.coordinates[1], lng: rider.currentLocation.coordinates[0] }} 
                  onClick={() => setSelectedRider(rider)}
                >
                    <img 
                      src={rider.vehicleType === 'Scooter' ? bikeIcon : truckIcon} 
                      alt="rider" 
                      style={{ width: '32px', height: '32px' }}
                    />
                </AdvancedMarker>
              ))}

              {selectedRider && selectedRider.currentLocation && (
                <InfoWindow 
                  position={{ lat: selectedRider.currentLocation.coordinates[1], lng: selectedRider.currentLocation.coordinates[0] }}
                  onCloseClick={() => setSelectedRider(null)}
                >
                  <div style={{ padding: '5px' }}>
                    <strong>{selectedRider.fullName}</strong><br />
                    <span>Vehicle: {selectedRider.vehicleType}</span><br />
                    <span>Phone: {selectedRider.phoneNumber}</span>
                  </div>
                </InfoWindow>
              )}
            </Map>
          ) : (
            <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
               Loading Maps...
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default RiderManager;
