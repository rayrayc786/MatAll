import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Upload, Loader2, X, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AISearch: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openUpload') === 'true') {
      const token = localStorage.getItem('token');
      if (token) {
        setShowModal(true);
        // Clean up the URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location, navigate]);

  const requireLogin = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr || userStr === '{}') {
      toast.error('Please log in to upload material lists and images.');
      setShowModal(false);
      const currentPath = location.pathname === '/login' ? '/' : location.pathname;
      navigate('/login', { state: { from: `${currentPath}?openUpload=true` } });
      return null;
    }
    return JSON.parse(userStr);
  };

  // --- Voice Search ---
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      navigate(`/products?search=${transcript}`);
    };
    recognition.start();
  };

  // --- Image Processing ---
  const handleFileUploadClick = () => {
    if (requireLogin()) {
      fileInputRef.current?.click();
    }
  };

  const startCameraClick = async () => {
    if (requireLogin()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error("Camera access denied.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          processImage(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageBase64: string) => {
    const user = requireLogin();
    if (!user) return;

    setIsProcessing(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user-requests`, {
        name: user.fullName || user.name || 'Unknown User',
        phone: user.phoneNumber || user.phone || 'Unknown Phone',
        imageBase64
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowModal(false);
      }, 3000);
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error('Failed to submit request to admin.');
    } finally {
      setIsProcessing(false);
      if (videoRef.current?.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      processImage(dataUrl);
    }
  };

  return (
    <>
      <div className="ai-search-container">
        <div className="ai-search-triggers">
          <button type="button" onClick={startVoiceSearch} className={`ai-trigger ${isRecording ? 'pulse' : ''}`}>
            <Mic size={18} />
          </button>
          <button type="button" onClick={() => setShowModal(true)} className="ai-trigger">
            <Camera size={18} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="ai-modal card">
            <div className="modal-header">
              <h3>Advanced Material Search</h3>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {isSuccess ? (
                <div className="processing-state" style={{ color: '#0c831f' }}>
                  <CheckCircle size={48} />
                  <p>Request Sent Successfully!</p>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Admin team will review your list shortly.</span>
                </div>
              ) : isProcessing ? (
                <div className="processing-state">
                  <Loader2 className="spinner" size={48} />
                  <p>Uploading to Admin Team...</p>
                </div>
              ) : (
                <div className="search-options-grid">
                  <div className="option-card" onClick={handleFileUploadClick}>
                    <Upload size={32} />
                    <span>Upload Image</span>
                    <p>Handwritten lists or BOQs</p>
                  </div>
                  <div className="option-card" onClick={startCameraClick}>
                    <Camera size={32} />
                    <span>Use Camera</span>
                    <p>Capture site notes live</p>
                  </div>
                </div>
              )}
              
              <video ref={videoRef} autoPlay playsInline style={{ display: videoRef.current?.srcObject && !isProcessing && !isSuccess ? 'block' : 'none', width: '100%', borderRadius: '12px', marginTop: '1rem' }} />
              {videoRef.current?.srcObject && !isProcessing && !isSuccess && (
                <button type="button" onClick={capturePhoto} className="capture-btn" style={{ background: '#FFEA00', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '8px', width: '100%', marginTop: '10px', fontWeight: 'bold' }}>
                  Send Capture to Admin
                </button>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept="image/*" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISearch;
