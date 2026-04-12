import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Upload, Loader2, X, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AISearch: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (window as any).openAISearchModal = () => setShowModal(true);
    (window as any).startVoiceSearchGlobal = startVoiceSearch;
    
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openUpload') === 'true') {
      const token = localStorage.getItem('token');
      if (token) {
        setShowModal(true);
        navigate(location.pathname, { replace: true });
      }
    }
    return () => {
      delete (window as any).openAISearchModal;
      delete (window as any).startVoiceSearchGlobal;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [location, navigate]);

  const requireLogin = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && (!userStr || userStr === '{}' || userStr === 'undefined')) {
      return { fullName: 'MatAll User', phoneNumber: 'Verified' };
    }

    if (!token) {
      toast.error('Please log in to upload material lists and images.');
      setShowModal(false);
      const currentPath = location.pathname === '/login' ? '/' : location.pathname;
      navigate('/login', { state: { from: `${currentPath}?openUpload=true` } });
      return null;
    }
    
    try {
      return JSON.parse(userStr || '{}');
    } catch (e) {
      return null;
    }
  };

  const recognitionRef = useRef<any>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success("Listening...", { id: 'voice-search-toast' });
      };

      recognition.onend = () => {
        setIsRecording(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        recognitionRef.current = null;
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable it in browser settings.");
        } else if (event.error === 'network') {
          const isBrave = !!(navigator as any).brave;
          if (isBrave) {
            toast.error("Network error: Brave browser blocks voice search by default. Please enable 'Google Services for Push Messaging and Speech Recognition' in settings.", { duration: 6000 });
          } else {
            toast.error("Network error: Browser could not connect to speech recognition service. Please check your internet or try another browser.");
          }
        } else if (event.error === 'no-speech') {
          toast.error("No speech detected. Please speak more clearly.");
        } else if (event.error === 'service-not-allowed') {
          toast.error("Speech service not allowed. Check your browser's privacy settings.");
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (!transcript) return;
        
        toast.success(`Searching for: ${transcript}`, { id: 'voice-search-toast' });
        setTimeout(() => {
          navigate(`/products?search=${encodeURIComponent(transcript.trim())}`);
        }, 500);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsRecording(false);
      toast.error("Could not start voice search.");
    }
  };

  const handleFileUploadClick = () => {
    if (requireLogin()) {
      fileInputRef.current?.click();
    }
  };

  const startCameraClick = async () => {
    if (requireLogin()) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setShowCameraModal(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        toast.error("Camera access denied or device not found.");
      }
    }
  };

  const closeAndStopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowModal(false);
    setShowCameraModal(false);
    setIsSuccess(false);
  };

  const closeCameraOnly = () => {
     if (videoRef.current?.srcObject) {
       const stream = videoRef.current.srcObject as MediaStream;
       stream.getTracks().forEach(track => track.stop());
       videoRef.current.srcObject = null;
     }
     setShowCameraModal(false);
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
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user-requests`, {
        userId: user._id || user.id,
        name: user.fullName || user.name || 'Unknown User',
        phone: user.phoneNumber || user.phone || 'Unknown Phone',
        imageBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSuccess(true);
      setShowCameraModal(false);
      setTimeout(() => {
        setIsSuccess(false);
        setShowModal(false);
      }, 3000);
    } catch (err) {
      toast.error('Failed to submit request to admin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop camera tracks immediately
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      processImage(dataUrl);
    }
  };

  return (
    <>
    <div className="ai-search-container">
      <div className="ai-search-triggers">
        <div className="icon-divider"></div>
        <button type="button" onClick={startVoiceSearch} className={`ai-trigger ${isRecording ? 'pulse' : ''}`} title="Voice Search">
          <Mic size={18} />
        </button>
        <button type="button" onClick={() => setShowModal(true)} className="ai-trigger" title="Camera/Upload Search">
          <Camera size={18} />
        </button>
      </div>
    </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="ai-modal card">
            <div className="modal-header">
              <h3>Advanced Material Search</h3>
              <button type="button" onClick={closeAndStopCamera}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {isSuccess ? (
                <div className="processing-state" style={{ color: '#0c831f' }}>
                  <CheckCircle size={48} />
                  <p style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '8px' }}>Uploading to our experts</p>
                  <span style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', maxWidth: '80%' }}>
                    Your requirement is received. Our team will contact you soon. 
                    To expedite, you can click on <Link to="/support" style={{ color: '#0c831f', textDecoration: 'underline', fontWeight: '500' }}>support</Link>.
                  </span>
                </div>
              ) : isProcessing ? (
                <div className="processing-state">
                  <Loader2 className="spinner" size={48} />
                  <p>Uploading to our experts...</p>
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
              
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden accept="image/*" />
            </div>
          </div>
        </div>
      )}

      {showCameraModal && (
        <div className="modal-overlay camera-modal-overlay" style={{ zIndex: 100000 }}>
          <div className="camera-fullscreen-container animate-fade-in">
             <div className="camera-header-premium">
                <div className="cam-meta">
                    <span className="live-pill">LIVE</span>
                    <span className="cam-title">Scan Material List</span>
                </div>
                <button className="cam-close-btn-premium" onClick={closeCameraOnly}><X size={24} /></button>
             </div>
             
             <div className="video-viewport">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="live-video-feed-premium"
                />
             </div>

             <div className="camera-controls-premium">
                <p className="cam-instruction">Position your list within the frame</p>
                <div className="capture-action-row">
                    <button 
                      className="camera-capture-ring" 
                      onClick={capturePhoto}
                      disabled={isProcessing}
                    >
                      <div className="inner-shutter">
                         {isProcessing && <Loader2 className="spinner-white" />}
                      </div>
                    </button>
                </div>
                <span className="cam-footer-text">Powered by MatAll AI Search</span>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AISearch;
