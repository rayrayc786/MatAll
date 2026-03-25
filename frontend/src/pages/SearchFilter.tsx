import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Mic, 
  Plus, 
  Camera, 
  PlayCircle,
  Search,
  X
} from 'lucide-react';
import './search-filter.css';

const SearchFilter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const { data } = await axios.get(`${baseUrl}/api/products?limit=20`);
        if (data && Array.isArray(data)) {
          setSuggestions(data.slice(0, 6));
          setTrending(data.slice(6, 12));
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      // Automatically search after a short delay
      setTimeout(() => {
        navigate(`/products?search=${encodeURIComponent(transcript)}`);
      }, 500);
    };

    recognition.start();
  };

  const handleSubmitRequirement = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 5000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getSafeName = (item: any) => {
    if (!item) return 'Product';
    const name = item.name || item.title || 'Product';
    return name.toString().split('|')[0].trim();
  };

  return (
    <div className="search-filter-page">
      <header className="search-filter-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="header-title">Search your product</h2>
      </header>

      <div className="search-filter-content">
        <form className="search-filter-bar" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search for plywood, wires and more" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Mic 
            size={22} 
            className={`mic-icon ${isListening ? 'listening' : ''}`} 
            onClick={handleVoiceSearch}
          />
        </form>

        <div className="search-actions-row">
          <div className="search-action-item" onClick={handleSubmitRequirement}>
            <div className="action-icon-box yellow">
              <Plus size={24} />
            </div>
            <span>Attach</span>
          </div>
          <div className="search-action-item" onClick={handleSubmitRequirement}>
            <div className="action-icon-box yellow">
              <Camera size={24} />
            </div>
            <span>Scan</span>
          </div>
          <div className="search-action-item" onClick={handleSubmitRequirement}>
            <div className="action-icon-box yellow">
              <PlayCircle size={24} fill="currentColor" />
            </div>
            <span>Record</span>
          </div>
        </div>

        <section className="suggestion-section">
          <h3>Product suggestions</h3>
          {loading ? (
            <div className="loading-text">Finding best matches...</div>
          ) : (
            <div className="suggestion-grid-3x2">
              {suggestions.length > 0 ? suggestions.map((item, idx) => (
                <div key={item?._id || idx} className="suggestion-tile" onClick={() => item?._id && navigate(`/products/${item._id}`)}>
                  <div className="tile-bg">
                     {getSafeName(item)}
                  </div>
                </div>
              )) : <div className="no-data">No suggestions</div>}
            </div>
          )}
        </section>

        <section className="suggestion-section">
          <h3>Products trending</h3>
          <div className="suggestion-grid-3x2">
            {trending.length > 0 ? trending.map((item, idx) => (
              <div key={item?._id || idx} className="suggestion-tile" onClick={() => item?._id && navigate(`/products/${item._id}`)}>
                <div className="tile-bg">
                    {getSafeName(item)}
                </div>
              </div>
            )) : <div className="no-data">Loading trending...</div>}
          </div>
        </section>
      </div>

      {showPopup && (
        <div className="requirement-popup">
          <div className="popup-content">
            <p>Thanks for sharing your requirement.</p>
            <p><strong>Give us a few moments to call you.</strong></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
