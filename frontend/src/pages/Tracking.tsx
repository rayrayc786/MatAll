import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, User, Clock, MapPin, Truck, CheckCircle2, Package, Loader2 } from 'lucide-react';
import { customerSocket, connectSocket } from '../socket';
import L from 'leaflet';
import toast from 'react-hot-toast';

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const StatusStep = ({ icon, label, isActive, isCompleted }: { icon: any, label: string, isActive: boolean, isCompleted: boolean }) => (
  <div className={`status-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
    <div className="step-icon" style={{ 
      width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#f1f5f9',
      color: isCompleted || isActive ? 'white' : '#94a3b8'
    }}>
      {isCompleted ? <CheckCircle2 size={20} /> : icon}
    </div>
    <div className="step-label">
      <span style={{ fontWeight: 700, color: isActive || isCompleted ? '#0f172a' : '#94a3b8' }}>{label}</span>
    </div>
  </div>
);

const Tracking: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [vehiclePos, setVehiclePos] = useState<any>([12.9716, 77.5946]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/orders/${id}`);
      setOrder(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrder();
    connectSocket(customerSocket);
    
    customerSocket.on('order-status-update', (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => ({ ...prev, status: data.status }));
        
        if (data.status === 'vendor-confirmed') {
          toast.success('Vendor has accepted your order!', { icon: '🏗️', duration: 5000 });
        } else if (data.status === 'rejected-by-vendor') {
          toast.error('Vendor has rejected your order. Refund initiated.', { duration: 6000 });
        } else if (data.status === 'dispatched') {
          toast.success('Your materials are on the way!');
        }
      }
    });

    return () => {
      customerSocket.off('order-status-update');
      customerSocket.disconnect();
    };
  }, [id]);

  if (loading) return <div className="content">Locating your shipment...</div>;

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: <Package size={20} /> },
    { key: 'vendor-confirmed', label: 'Vendor Accepted', icon: <CheckCircle2 size={20} /> },
    { key: 'picking', label: 'Picking & Packing', icon: <Loader2 size={20} className="animate-spin" /> },
    { key: 'dispatched', label: 'In Transit', icon: <Truck size={20} /> },
    { key: 'delivered', label: 'Delivered', icon: <MapPin size={20} /> },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === order.status);

  return (
    <main className="content tracking-page-modern" style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Track Procurement #BID-{id?.slice(-6).toUpperCase()}</h1>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ color: '#16a34a', fontWeight: 800 }}>● {order.status.toUpperCase().replace(/-/g, ' ')}</span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#64748b', fontWeight: 600 }}>ETA: 45 Mins</span>
        </div>
      </header>

      <div className="tracking-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem' }}>
        <section className="map-view card" style={{ padding: 0, overflow: 'hidden', height: '600px' }}>
          <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={vehiclePos} icon={truckIcon}>
              <Popup>Delivery Vehicle</Popup>
            </Marker>
          </MapContainer>
        </section>

        <aside className="tracking-status-sidebar">
          <div className="status-card card" style={{ padding: '2rem' }}>
            <h3>Fulfillment Progress</h3>
            <div className="status-stepper" style={{ marginTop: '1.5rem', position: 'relative' }}>
              <div className="stepper-line" style={{ position: 'absolute', left: '19px', top: '20px', bottom: '40px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
              {steps.map((step, idx) => (
                <StatusStep 
                  key={step.key}
                  icon={step.icon}
                  label={step.label}
                  isActive={order.status === step.key}
                  isCompleted={currentStepIdx > idx || order.status === 'delivered'}
                />
              ))}
            </div>
          </div>

          <div className="driver-card card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Logistics Partner</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, margin: 0 }}>{order.driverId ? 'Assigned Driver' : 'Awaiting Driver...'}</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Verified Professional</p>
              </div>
              <button className="icon-btn"><Phone size={18} /></button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Tracking;
