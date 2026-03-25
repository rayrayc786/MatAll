import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Construction, 
  Drill, 
  Wrench, 
  Layers, 
  Zap, 
  Truck, 
  HardHat, 
  Hammer,
  ShieldCheck,
  Paintbrush
} from 'lucide-react';
import toast from 'react-hot-toast';
import './login.css';

const BANNER_ICONS = [
  { icon: <Construction size={32} />, label: 'Building' },
  { icon: <Drill size={32} />, label: 'Tools' },
  { icon: <Wrench size={32} />, label: 'Plumbing' },
  { icon: <Layers size={32} />, label: 'Materials' },
  { icon: <Zap size={32} />, label: 'Electrical' },
  { icon: <Truck size={32} />, label: 'Logistics' },
  { icon: <HardHat size={32} />, label: 'Safety' },
  { icon: <Hammer size={32} />, label: 'Hardware' },
  { icon: <Paintbrush size={32} />, label: 'Finishing' },
  { icon: <ShieldCheck size={32} />, label: 'Quality' },
];

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState(1); // 1: Login/Sign up, 2: OTP
  const [timer, setTimer] = useState(30);
  const [countdown, setCountdown] = useState(15); // 15s auto-redirect per PRD page 4
  const [showCallButton, setShowCallButton] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<{ show: boolean, type: 'Terms' | 'Privacy' }>({ show: false, type: 'Terms' });
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const navigate = useNavigate();
  const autoRedirectTimer = useRef<any>(null);
  const resendTimer = useRef<any>(null);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Fetch product images for banner
  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?limit=20`);
        const imgs = data
          .map((p: any) => p.imageUrl)
          .filter((url: string) => url && !url.includes('unsplash'));
        
        if (imgs.length > 5) {
           setBannerImages(imgs);
        }
      } catch (err) {
        console.error('Failed to fetch banner images', err);
      }
    };
    fetchBannerImages();
  }, []);

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  // Auto-redirect to landing page if no action for 15 seconds (PRD Page 4)
  useEffect(() => {
    if (step === 1 && phoneNumber === '') {
      autoRedirectTimer.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(autoRedirectTimer.current);
            navigate('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (autoRedirectTimer.current) clearInterval(autoRedirectTimer.current);
    }
    return () => clearInterval(autoRedirectTimer.current);
  }, [step, phoneNumber]);

  // Resend / Call timer (PRD Page 6)
  useEffect(() => {
    if (step === 2) {
      resendTimer.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(resendTimer.current);
            setShowCallButton(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resendTimer.current);
  }, [step]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(value);
    setCountdown(15); // Reset countdown on activity
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { phoneNumber });
      setStep(2);
      setTimer(30);
      setShowCallButton(false);
      toast.success('OTP sent successfully');
    } catch (err: any) {
      toast.error('Failed to send OTP');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newVal = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = newVal;
    setOtp(newOtp);

    if (newVal && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    if (newOtp.every(val => val !== '') && index === 3) {
      verifyOTP(newOtp.join(''));
    }
  };

  const verifyOTP = async (code: string) => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify`, { phoneNumber, otp: code });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error('Invalid OTP code');
    }
  };

  const handleCallVerify = () => {
    toast.success('Initiating verification call...');
    // Mock logic for call verification
  };

  return (
    <div className="login-screen">
      {/* Running Banner */}
      <div className="login-banner">
        <div className="banner-track">
          {bannerImages.length > 0 ? (
            [...bannerImages, ...bannerImages, ...bannerImages].map((img, idx) => (
              <div key={idx} className="banner-img-item">
                <img src={getFullImageUrl(img)} alt="" />
              </div>
            ))
          ) : (
            [...BANNER_ICONS, ...BANNER_ICONS].map((item, idx) => (
              <div key={idx} className="banner-item">
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Brand Section */}
      <div className="login-branding">
        <div className="matall-logo">LOGO</div>
        <div className="tagline">Delivering all things construction</div>
      </div>

      <div className="login-form-container">
        {step === 1 ? (
          <>
            <h2 className="login-title">Log in or Sign up</h2>
            <form onSubmit={handleSendOTP} style={{ width: '100%' }}>
              <div className="mobile-input-wrapper">
                <span className="prefix">+91</span>
                <input 
                  type="tel" 
                  placeholder="Enter mobile number" 
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                className="login-btn btn-continue" 
                disabled={phoneNumber.length !== 10}
              >
                Continue
              </button>
            </form>
            <button 
              type="button" 
              className="login-btn btn-guest" 
              onClick={() => navigate('/')}
            >
              Continue as guest
            </button>
            
            {phoneNumber === '' && (
              <p className="auto-redirect-hint">Redirecting to landing page in {countdown}s...</p>
            )}
          </>
        ) : (
          <>
            <h2 className="login-title">OTP</h2>
            <p className="otp-subtitle">
              Please input the 4 digit code has been sent to your mobile <strong>XXXXXX{phoneNumber.slice(-4)}</strong>
            </p>
            <div className="otp-container">
              {otp.map((val, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  maxLength={1}
                  className="otp-box"
                  value={val}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !val && idx > 0) {
                      otpRefs[idx - 1].current?.focus();
                    }
                  }}
                />
              ))}
            </div>
            
            <div className="otp-actions">
              {showCallButton ? (
                <p className="resend-text">Did not get OTP? <button className="call-link" onClick={handleCallVerify}>Call me to verify</button></p>
              ) : (
                <p className="resend-text">Did not get code? <button className="resend-link" disabled={timer > 0} onClick={handleSendOTP}>Resend {timer > 0 ? `(${timer}s)` : ''}</button></p>
              )}
            </div>

            <button 
              type="button" 
              className="login-btn btn-guest" 
              onClick={() => navigate('/')}
            >
              Continue as guest
            </button>
          </>
        )}
      </div>

      <div className="login-footer">
        <p className="legal-text">
          By continuing, you are agreeing to app's <br/>
          <span className="legal-link" onClick={() => setShowLegalModal({ show: true, type: 'Terms' })}>Terms of Service</span> & <span className="legal-link" onClick={() => setShowLegalModal({ show: true, type: 'Privacy' })}>Privacy Policy</span>
        </p>
      </div>

      {showLegalModal.show && (
        <div className="legal-modal-overlay" onClick={() => setShowLegalModal({ ...showLegalModal, show: false })}>
          <div className="legal-modal-content" onClick={e => e.stopPropagation()}>
            <h3>{showLegalModal.type}</h3>
            <div className="legal-modal-body">
              <p>Key pointers for {showLegalModal.type}:</p>
              <ul>
                <li>Respect user data privacy.</li>
                <li>Ensure compliance with local laws.</li>
                <li>Transparent transaction policies.</li>
              </ul>
              <button className="btn-close-modal" onClick={() => setShowLegalModal({ ...showLegalModal, show: false })}>Read More</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
