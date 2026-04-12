import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Mic, 
  Plus, 
  Camera, 
  PlayCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './search-filter.css';
import SEO from '../components/SEO';

const SearchFilter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [baseSuggestions, setBaseSuggestions] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const { data } = await axios.get(`${baseUrl}/api/products?limit=20`);
        if (data && Array.isArray(data)) {
          setBaseSuggestions(data.slice(0, 6));
          setSuggestions(data.slice(0, 6));
          setTrending(data.slice(6, 12));
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
          const { data } = await axios.get(`${baseUrl}/api/products/autocomplete?q=${searchTerm}`);
          setSuggestions(data.slice(0, 6));
        } catch (err) {
          console.error('Suggestions error:', err);
        } finally {
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else if (searchTerm.trim().length === 0) {
      setSuggestions(baseSuggestions);
    }
  }, [searchTerm, baseSuggestions]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const recognitionRef = React.useRef<any>(null);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser.');
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
        setIsListening(true);
        toast.success("Listening...", { id: 'voice-search-toast' });
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        recognitionRef.current = null;
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable it in browser settings.");
        } else if (event.error === 'network') {
          const isBrave = !!(navigator as any).brave;
          if (isBrave) {
            toast.error("Network error: Brave browser blocks voice search. Please enable 'Google Services' in settings.", { duration: 6000 });
          } else {
            toast.error("Network error: Could not connect to speech service. Please check your internet.");
          }
        } else if (event.error === 'no-speech') {
          toast.error("No speech detected. Please try again.");
        } else if (event.error === 'service-not-allowed') {
          toast.error("Speech service not allowed. Check your browser's privacy settings.");
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (!transcript) return;
        
        setSearchTerm(transcript);
        toast.success(`Searching for: ${transcript}`, { id: 'voice-search-toast' });
        
        setTimeout(() => {
          navigate(`/products?search=${encodeURIComponent(transcript.trim())}`);
        }, 800);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition exception:', err);
      setIsListening(false);
      toast.error("Could not start voice search.");
    }
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
      <SEO title="Search Products" description="Search for building materials, tools, and hardware on MatAll. Get everything you need delivered in 60 minutes." />
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
          <div className="search-bar-actions-mobile">
            <Mic 
              size={22} 
              className={`mic-icon ${isListening ? 'listening' : ''}`} 
              onClick={handleVoiceSearch}
            />
            <div className="icon-divider-v"></div>
            <Camera 
              size={22} 
              className="camera-icon-mobile"
              onClick={() => {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('openUpload', 'true');
                navigate(`/?openUpload=true`); // Navigate home to trigger AISearch modal
              }}
            />
          </div>
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
