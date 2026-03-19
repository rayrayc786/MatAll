import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Phone, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { phoneNumber });
      setStep(2);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify`, { phoneNumber, otp });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-brand">
          BuildIt<span>Quick</span>
        </div>
        
        <h2>{step === 1 ? 'Jobsite Access' : 'Verify Identity'}</h2>
        <p>
          {step === 1 
            ? 'Enter your registered phone number to manage materials and logistics.' 
            : `We've sent a secure 4-digit code to ${phoneNumber}`
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
            <button type="submit" className="login-submit-btn">
              Send OTP Code <ArrowRight size={20} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="phone-input-group">
              <label>Secure OTP</label>
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
                  style={{ letterSpacing: '0.5em', textAlign: 'center', paddingLeft: '1.25rem' }}
                />
              </div>
            </div>
            <button type="submit" className="login-submit-btn">
              Verify & Proceed <CheckCircle2 size={20} />
            </button>
            <button type="button" className="resend-link-btn" onClick={() => setStep(1)}>
              Wait, that's the wrong number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
