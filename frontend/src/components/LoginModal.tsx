import React, { useState } from 'react';
import axios from 'axios';
import { Phone, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { phoneNumber });
      setStep(2);
      setError('');
      toast.success('OTP sent to ' + phoneNumber);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify`, { phoneNumber, otp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Login successful!');
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="login-card" style={{ position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <X size={24} />
        </button>

        <div className="login-logo-brand">
          BuildIt<span>Quick</span>
        </div>
        
        <h2>{step === 1 ? 'Quick Login' : 'Verify OTP'}</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          {step === 1 
            ? 'Login to place your order and track delivery.' 
            : `Enter the code sent to ${phoneNumber}`
          }
        </p>
        
        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="phone-input-group">
              <label>Phone Number</label>
              <div className="phone-field-wrapper">
                <Phone size={20} className="icon" />
                <input 
                  type="tel" 
                  placeholder="9876543210" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP Code'} <ArrowRight size={20} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="phone-input-group">
              <label>Enter OTP</label>
              <div className="phone-field-wrapper">
                <CheckCircle2 size={20} className="icon" />
                <input 
                  type="text" 
                  placeholder="1111" 
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  style={{ letterSpacing: '0.5em', textAlign: 'center' }}
                />
              </div>
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Proceed'} <CheckCircle2 size={20} />
            </button>
            <button type="button" className="resend-link-btn" onClick={() => setStep(1)}>
              Wrong number? Go back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
