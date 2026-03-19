import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Scan, 
  CheckCircle2, 
  Package, 
  ArrowRight,
  Info
} from 'lucide-react';

const TaskVerification: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [verifiedItems, setVerifiedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrder();
  }, [id]);

  const toggleVerify = (itemId: string) => {
    if (verifiedItems.includes(itemId)) {
      setVerifiedItems(prev => prev.filter(i => i !== itemId));
    } else {
      setVerifiedItems(prev => [...prev, itemId]);
    }
  };

  const handleStartDelivery = async () => {
    if (verifiedItems.length < (order?.items?.length || 0)) {
      alert('Please verify all items before starting delivery.');
      return;
    }

    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}/status`, { status: 'dispatched' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate(`/driver/delivery/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="content">Loading pickup details...</div>;

  return (
    <main className="content task-verification">
      <header className="driver-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pickup Verification</h1>
        <p style={{ color: '#64748b' }}>Scan barcodes to confirm technical grade & quantity</p>
      </header>

      <div className="pickup-summary card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Info size={20} color="#64748b" />
          <div>
            <strong>Dark Store #04 - Bangalore Central</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Bay 12, Heavy Loading Zone</p>
          </div>
        </div>
      </div>

      <section className="items-to-verify">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Items to Load ({verifiedItems.length}/{order.items?.length})</h3>
        <div className="verification-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {order.items?.map((item: any) => (
            <div key={item._id} className={`item-verify-card card ${verifiedItems.includes(item._id) ? 'verified' : ''}`} 
                 style={{ 
                   padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                   borderLeft: verifiedItems.includes(item._id) ? '4px solid #16a34a' : '1px solid #e2e8f0',
                   opacity: verifiedItems.includes(item._id) ? 0.8 : 1
                 }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px' }}><Package size={24} /></div>
                <div>
                  <h4 style={{ margin: 0 }}>Product ID: {item.productId.slice(-6).toUpperCase()}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Quantity: {item.quantity} units | Weight: {item.totalWeight}kg</p>
                </div>
              </div>
              <button 
                onClick={() => toggleVerify(item._id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', 
                  border: 'none', background: verifiedItems.includes(item._id) ? '#dcfce7' : '#0f172a',
                  color: verifiedItems.includes(item._id) ? '#16a34a' : 'white', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {verifiedItems.includes(item._id) ? <CheckCircle2 size={18} /> : <Scan size={18} />}
                {verifiedItems.includes(item._id) ? 'VERIFIED' : 'SCAN BARCODE'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
        <button 
          onClick={handleStartDelivery}
          style={{ 
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none', 
            background: verifiedItems.length === order.items?.length ? '#f59e0b' : '#cbd5e1',
            color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          START DELIVERY <ArrowRight size={20} />
        </button>
      </footer>
    </main>
  );
};

export default TaskVerification;
