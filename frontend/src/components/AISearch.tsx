import React, { useState, useRef } from 'react';
import { Mic, Camera, Upload, Loader2, X } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useNavigate } from 'react-router-dom';

const AISearch: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // --- Voice Search ---
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (imageSource: File | string) => {
    setIsProcessing(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng');
      const lines = text.split('\n').filter(line => line.trim().length > 2);
      if (lines.length > 0) {
        navigate(`/products?search=${lines[0].trim()}`);
        setShowModal(false);
      } else {
        alert("Could not detect material names.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      
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
              {isProcessing ? (
                <div className="processing-state">
                  <Loader2 className="spinner" size={48} />
                  <p>AI Engine Parsing Your List...</p>
                </div>
              ) : (
                <div className="search-options-grid">
                  <div className="option-card" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={32} />
                    <span>Upload Image</span>
                    <p>Handwritten lists or BOQs</p>
                  </div>
                  <div className="option-card" onClick={startCamera}>
                    <Camera size={32} />
                    <span>Use Camera</span>
                    <p>Capture site notes live</p>
                  </div>
                </div>
              )}
              
              <video ref={videoRef} autoPlay playsInline style={{ display: videoRef.current?.srcObject ? 'block' : 'none', width: '100%', borderRadius: '12px', marginTop: '1rem' }} />
              {videoRef.current?.srcObject && !isProcessing && (
                <button type="button" onClick={capturePhoto} className="capture-btn">Capture & Analyze</button>
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
