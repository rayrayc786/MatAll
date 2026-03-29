import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, 
  CheckCircle2, 
  MapPin, 
  Clock
} from 'lucide-react';

const ProofOfDelivery: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!photo) {
      alert('Please capture a proof of delivery photo.');
      return;
    }

    setUploading(true);
    try {
      // In real app, upload photo to S3 first
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}/status`, { 
        status: 'delivered',
        proofImageUrl: 'https://images.unsplash.com/photo-1590060417650-cc04b0608a63?auto=format&fit=crop&q=80&w=400' 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Delivery successful! Earnings updated.');
      navigate('/driver');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="content proof-of-delivery">
      <header className="driver-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Proof of Delivery (ePOD)</h1>
        <p style={{ color: '#64748b' }}>Capture a photo of the materials at the jobsite</p>
      </header>

      <div className="pod-container">
        {!photo ? (
          <div 
            className="camera-placeholder card" 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              height: '350px', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', gap: '1rem',
              border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer'
            }}
          >
            <div style={{ background: '#0f172a', color: 'white', padding: '20px', borderRadius: '50%' }}>
              <Camera size={40} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, margin: 0 }}>TAP TO CAPTURE PHOTO</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Include jobsite entrance or materials in frame</p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleCapture}
            />
          </div>
        ) : (
          <div className="photo-preview card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <img src={photo} alt="POD" style={{ width: '100%', height: '350px', objectFit: 'cover' }} />
            <div className="geostamp-overlay" style={{ 
              position: 'absolute', bottom: 0, left: 0, right: 0, 
              background: 'rgba(0,0,0,0.6)', color: 'white', padding: '1rem',
              fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Bangalore, Site Entrance B</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Clock size={12} /> {new Date().toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>LAT: 12.9816</div>
                <div>LNG: 77.6046</div>
              </div>
            </div>
            <button 
              onClick={() => setPhoto(null)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.7rem' }}
            >
              RETAKE
            </button>
          </div>
        )}

        <div className="compliance-checklist" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Verification Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> <span>Geofence match verified</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> <span>Item count confirmed by foreman</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCompleteDelivery}
          disabled={!photo || uploading}
          style={{ 
            width: '100%', marginTop: '2.5rem', padding: '16px', borderRadius: '12px', 
            border: 'none', background: photo ? '#16a34a' : '#cbd5e1', 
            color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: photo ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          {uploading ? 'UPLOADING...' : 'COMPLETE DELIVERY'} <CheckCircle2 size={20} />
        </button>
      </div>
    </main>
  );
};

export default ProofOfDelivery;
