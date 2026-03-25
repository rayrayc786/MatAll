import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, X, Home, Map as MapIcon, Loader2, ChevronRight, Mic, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './locationModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coords: [number, number]) => void;
  currentAddress?: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Decision, 2: Search/Selection
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New address form states (Slide 40)
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrType, setNewAddrType] = useState<'Home' | 'Office' | 'Site' | 'Other'>('Home');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrCoords, setNewAddrCoords] = useState<[number, number] | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [tower, setTower] = useState('');
  const [landmark, setLandmark] = useState('');
  const [directions, setDirections] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setShowAddForm(false);
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrCoords || !newAddrText) {
        toast.error('Please select an address from suggestions');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formattedAddress = `${houseNumber ? houseNumber + ', ' : ''}${floor ? 'Floor ' + floor + ', ' : ''}${tower ? tower + ', ' : ''}${newAddrText}${landmark ? ' (Near ' + landmark + ')' : ''}`;
        
        const newJobsite = {
            name: newAddrName || newAddrType,
            addressType: newAddrType,
            addressText: formattedAddress,
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
        onSelectAddress(formattedAddress, newAddrCoords);
        onClose();
    } catch (err) {
        toast.error('Failed to add address');
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
          {!showAddForm ? (
            step === 1 ? (
              <div className="location-decision-step">
                 <div className="decision-illustration">
                    <h2>Where shall we deliver?</h2>
                    <p>This helps us deliver your order quick.</p>
                 </div>
                 <div className="decision-actions">
                    <button className="decision-btn yellow" onClick={() => setStep(2)}>
                       I am not at the delivery location
                    </button>
                    <button className="decision-btn black" onClick={handleUseCurrentLocation} disabled={isLocating}>
                       {isLocating ? 'Locating...' : 'I am at the delivery location'}
                    </button>
                 </div>
                 <div className="existing-addresses-preview">
                    <div className="section-header-mini">
                       <h4>Your saved addresses</h4>
                       <button className="add-new-mini" onClick={() => setShowAddForm(true)}>+ Add New</button>
                    </div>
                    {isLoggedIn && user.jobsites?.length > 0 ? (
                      user.jobsites.map((site: any, idx: number) => (
                        <div key={idx} className="saved-addr-mini" onClick={() => onSelectAddress(site.addressText, site.location.coordinates)}>
                          <div className="addr-icon-small">
                             {site.addressType === 'Home' ? <Home size={16}/> : <MapIcon size={16}/>}
                          </div>
                          <div className="addr-text-mini">
                             <strong>{site.name}</strong>
                             <p>{site.addressText}</p>
                          </div>
                          <ChevronRight size={16} />
                        </div>
                      ))
                    ) : <p className="no-addr-text">No saved addresses</p>}
                 </div>
              </div>
            ) : (
              <div className="location-search-step">
                <div className="search-wrapper">
                  <Search size={20} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search for area, street name..." 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    autoFocus
                  />
                  {isSearching && <Loader2 size={18} className="animate-spin" />}
                </div>
                {suggestions.length > 0 ? (
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
                ) : (
                  <div className="empty-search-state" onClick={handleUseCurrentLocation}>
                     <Navigation size={20} />
                     <span>Use current location</span>
                  </div>
                )}
                <button className="back-link-btn" onClick={() => setStep(1)}>Back</button>
              </div>
            )
          ) : (
            <div className="add-address-form">
              <div className="form-header-row">
                 <button className="back-btn" onClick={() => setShowAddForm(false)}>
                    <ArrowLeft size={20} />
                 </button>
                 <h3>Add more address details</h3>
              </div>
              
              <div className="search-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search city, area or street..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              {suggestions.length > 0 && (
                <div className="search-suggestions mini">
                  {suggestions.map((item, idx) => (
                    <div key={idx} className="suggestion-row" onClick={() => selectSuggestion(item)}>
                      <div className="suggestion-details">
                        <p className="main-text">{item.display_name.split(',')[0]}</p>
                        <p className="sub-text">{item.display_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddAddress}>
                <div className="form-group">
                  <label>Who are you ordering for?</label>
                  <div className="ordering-for-toggle">
                     <button type="button" className="toggle-btn active">Yourself</button>
                     <button type="button" className="toggle-btn">Someone else</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Nickname</label>
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

                <div className="form-grid-2col">
                   <div className="form-group">
                       <label>House/ Unit Number</label>
                       <input type="text" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} placeholder="e.g. 402" />
                   </div>
                   <div className="form-group">
                       <label>Floor</label>
                       <input type="text" value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g. 4th" />
                   </div>
                </div>

                <div className="form-group">
                    <label>Tower/ Block (optional)</label>
                    <input type="text" value={tower} onChange={e => setTower(e.target.value)} placeholder="e.g. Block B" />
                </div>

                <div className="form-group">
                    <label>Nearby Landmark</label>
                    <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Petrol Pump" />
                </div>

                <div className="form-group directions-group">
                    <label>Directions for rider</label>
                    <div className="input-with-mic">
                       <input type="text" value={directions} onChange={e => setDirections(e.target.value)} placeholder="e.g. Yellow gate" />
                       <Mic size={18} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Recipient's name</label>
                    <input type="text" value={newAddrName} onChange={e => setNewAddrName(e.target.value)} placeholder="e.g. Rahul Arora" />
                </div>

                <div className="form-group">
                    <label>Recipient's mobile number</label>
                    <input type="text" value={newAddrPhone} onChange={e => setNewAddrPhone(e.target.value)} placeholder="9876543210" />
                </div>

                <button type="submit" className="save-btn" disabled={!newAddrCoords}>Add complete address</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
