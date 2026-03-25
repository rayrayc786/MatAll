import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  CreditCard, 
  Smartphone, 
  Globe,
  CheckCircle2,
  Plus,
  ThumbsUp
} from 'lucide-react';
import './payment-method.css';

const PaymentMethod: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('upi-gpay');
  const [showSuccess, setShowSuccess] = useState(false);

  const PAYMENT_GROUPS = [
    {
      title: 'Recent methods',
      items: [
        { id: 'upi-gpay', name: 'Google Pay', icon: <Smartphone size={20} />, sub: 'UPI ID: rahul@okaxis' },
        { id: 'card-1234', name: 'HDFC Credit Card', icon: <CreditCard size={20} />, sub: '**** 1234 | Secured' },
      ]
    },
    {
      title: 'Pay by any UPI app',
      items: [
        { id: 'upi-phonepe', name: 'PhonePe', icon: <div className="upi-circle">P</div> },
        { id: 'upi-paytm', name: 'Paytm', icon: <div className="upi-circle">Py</div> },
        { id: 'upi-bhim', name: 'BHIM', icon: <div className="upi-circle">B</div> },
      ]
    },
    {
      title: 'Pay by card (credit/ debit)',
      items: [
        { id: 'new-card', name: 'Add New Card', icon: <Plus size={20} /> },
      ]
    },
    {
      title: 'Pay by NetBanking',
      items: [
        { id: 'net-hdfc', name: 'HDFC Bank', icon: <Globe size={20} /> },
        { id: 'net-icici', name: 'ICICI Bank', icon: <Globe size={20} /> },
      ]
    }
  ];

  const handlePayment = () => {
    setShowSuccess(true);
    // Automatically redirect after animation
    setTimeout(() => {
      navigate('/tracking/mock-order-id');
    }, 3000);
  };

  return (
    <div className="payment-page">
      <header className="payment-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h2>Select Payment Method</h2>
        <Link to="/" className="home-btn-link">
          <Home size={24} />
        </Link>
      </header>

      <main className="payment-content">
        {PAYMENT_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="payment-group-box">
            <div className="group-header-row">
               <h3>{group.title}</h3>
               <ChevronRight size={18} color="#94a3b8" />
            </div>
            <div className="group-items">
               {group.items.map((item: any) => (
                 <div 
                   key={item.id} 
                   className={`payment-item-row ${selected === item.id ? 'active' : ''}`}
                   onClick={() => setSelected(item.id)}
                 >
                    <div className="item-icon-circle">
                       {item.icon}
                    </div>
                    <div className="item-info">
                       <span className="item-name">{item.name}</span>
                       {item.sub && <span className="item-sub">{item.sub}</span>}
                    </div>
                    {selected === item.id && <CheckCircle2 size={20} color="#000" fill="#FFEA00" />}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </main>

      <footer className="payment-footer">
         <button className="make-payment-btn" onClick={handlePayment}>
            Make payment
         </button>
      </footer>

      {showSuccess && (
        <div className="payment-success-overlay">
          <div className="success-card">
            <div className="thumbs-up-circle">
              <ThumbsUp size={64} color="#000" fill="#FFEA00" />
            </div>
            <h2 className="success-title">Order Confirmed!</h2>
            <p className="success-sub">Your payment was successful</p>
            <p className="notification-note">You will receive a WhatsApp & SMS confirmation shortly.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;
