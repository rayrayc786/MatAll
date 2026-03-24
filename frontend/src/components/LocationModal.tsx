import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Plus, Share2, MoreVertical, X, Home, Briefcase, Map as MapIcon, Loader2, ChevronRight, Phone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './locationModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coords: [number, number]) => void;
  currentAddress: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectAddress, currentAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New address form states
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrType, setNewAddrType] = useState<'Home' | 'Office' | 'Site' | 'Other'>('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrCoords, setNewAddrCoords] = useState<[number, number] | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (val.length > 2) {
      searchTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&countrycodes=in`);
          setSuggestions(data);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        onSelectAddress(data.display_name, [longitude, latitude]);
        onClose();
      } catch (err) {
        toast.error('Failed to get address');
      } finally {
        setIsLocating(false);
      }
    }, () => {
      setIsLocating(false);
      toast.error('Location access denied');
    });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrCoords || !newAddrText) {
        toast.error('Please select an address from suggestions');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const newJobsite = {
            name: newAddrName || newAddrType,
            addressType: newAddrType,
            addressText: newAddrText,
            contactPhone: newAddrPhone,
            location: {
                type: 'Point',
                coordinates: newAddrCoords
            }
        };

        const updatedJobsites = [...(user.jobsites || []), newJobsite];
        
        const { data } = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
            { jobsites: updatedJobsites },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Address added successfully');
        setShowAddForm(false);
        onSelectAddress(newAddrText, newAddrCoords);
        onClose();
    } catch (err) {
        toast.error('Failed to add address');
    }
  };

  const selectSuggestion = (item: any) => {
    if (showAddForm) {
        setNewAddrText(item.display_name);
        setNewAddrCoords([parseFloat(item.lon), parseFloat(item.lat)]);
        setSuggestions([]);
        setSearchTerm(item.display_name);
    } else {
        onSelectAddress(item.display_name, [parseFloat(item.lon), parseFloat(item.lat)]);
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-content">
        <div className="location-modal-header">
          <h2>Select delivery location</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="location-modal-body">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for area, street name..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {isSearching && <Loader2 size={18} className="animate-spin" />}
          </div>

          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((item, idx) => (
                <div key={idx} className="suggestion-row" onClick={() => selectSuggestion(item)}>
                  <MapPin size={18} className="pin-icon" />
                  <div className="suggestion-details">
                    <p className="main-text">{item.display_name.split(',')[0]}</p>
                    <p className="sub-text">{item.display_name}</p>
                  </div>
                  <ChevronRight size={18} />
                </div>
              ))}
            </div>
          )}

          {!searchTerm && !showAddForm && (
            <>
              <div className="action-item" onClick={handleUseCurrentLocation}>
                <div className="icon-circle current-loc"><Navigation size={20} /></div>
                <div className="action-details">
                  <h3>Use current location</h3>
                  <p>{isLocating ? 'Locating...' : currentAddress}</p>
                </div>
                <ChevronRight size={18} />
              </div>

              <div className="action-item" onClick={() => setShowAddForm(true)}>
                <div className="icon-circle add-new"><Plus size={20} /></div>
                <div className="action-details">
                  <h3>Add new address</h3>
                </div>
                <ChevronRight size={18} />
              </div>

              <div className="saved-addresses-section">
                <h4>Your saved addresses</h4>
                {isLoggedIn && user.jobsites && user.jobsites.length > 0 ? (
                  user.jobsites.map((site: any, idx: number) => (
                    <div key={idx} className="saved-address-card" onClick={() => onSelectAddress(site.addressText, site.location.coordinates)}>
                      <div className="addr-icon">
                        {site.addressType === 'Home' && <Home size={20} />}
                        {site.addressType === 'Office' && <Briefcase size={20} />}
                        {site.addressType === 'Site' && <MapIcon size={20} />}
                        {site.addressType === 'Other' && <MapPin size={20} />}
                      </div>
                      <div className="addr-info">
                        <div className="addr-header">
                          <span className="addr-name">{site.name}</span>
                        </div>
                        <p className="addr-text">{site.addressText}</p>
                        {site.contactPhone && (
                          <p className="addr-phone"><Phone size={12} /> {site.contactPhone}</p>
                        )}
                        <div className="addr-actions">
                          <button onClick={(e) => { e.stopPropagation(); }}><MoreVertical size={16} /></button>
                          <button onClick={(e) => { e.stopPropagation(); }}><Share2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-addresses">No saved addresses found.</p>
                )}
              </div>
            </>
          )}

          {showAddForm && (
            <div className="add-address-form">
              <button className="back-btn" onClick={() => setShowAddForm(false)}>Back to selection</button>
              <form onSubmit={handleAddAddress}>
                <div className="form-group">
                  <label>Address Label (e.g. Home, Office)</label>
                  <div className="type-chips">
                    {['Home', 'Office', 'Site', 'Other'].map(type => (
                      <button 
                        key={type} 
                        type="button" 
                        className={`chip ${newAddrType === type ? 'active' : ''}`}
                        onClick={() => setNewAddrType(type as any)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                    <label>Receiver's Name (Optional)</label>
                    <input type="text" value={newAddrName} onChange={e => setNewAddrName(e.target.value)} placeholder="e.g. Rahul Arora" />
                </div>
                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" value={newAddrPhone} onChange={e => setNewAddrPhone(e.target.value)} placeholder="For delivery updates" />
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <div className="address-display">
                        {newAddrText || "Select address using search above"}
                    </div>
                </div>
                <button type="submit" className="save-btn" disabled={!newAddrCoords}>Save and Select</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
