import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, X, Home, Map as MapIcon, Loader2, ChevronRight, Mic, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Map, Marker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import './locationModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coords: [number, number]) => void;
  currentAddress?: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onSelectAddress, currentAddress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Decision, 2: Search/Selection
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isServiceable, setIsServiceable] = useState(true);

  
  // New address form states
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
  const [orderingFor, setOrderingFor] = useState<'Yourself' | 'Someone else'>('Yourself');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');

  // Safe Marker component using stable Marker
  const MapMarker = ({ position }: { position: google.maps.LatLngLiteral }) => {
    const map = useMap();
    if (!map) return null;
    return <Marker position={position} />;
  };

  // Sync form state when user transitions to add address form
  useEffect(() => {
    if (showAddForm && !newAddrText) {
      if (selectedAddress || searchTerm || currentAddress) {
        setNewAddrText(selectedAddress || searchTerm || currentAddress || '');
        setNewAddrCoords([mapCenter.lng, mapCenter.lat]);
      }
    }
  }, [showAddForm, selectedAddress, searchTerm, currentAddress, mapCenter]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setShowAddForm(false);
      
      if (currentAddress) setSearchTerm(currentAddress);

      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition((pos) => {
           setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
         }, () => {}, { timeout: 10000 });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length > 2 && placesLibrary) {
        setIsSearching(true);
        try {
            const request: any = {
                input: value,
                locationRestriction: new google.maps.LatLngBounds(
                    new google.maps.LatLng(8.4, 68.7),
                    new google.maps.LatLng(37.0, 97.2)
                ),
                includedRegionCodes: ['in']
            };
            const { suggestions: results } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            setSuggestions(results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    } else {
        setSuggestions([]);
    }
  };

  const checkPincode = async (results: any) => {
    const addressComponents = results[0].address_components;
    const pincodeComp = addressComponents.find((c: any) => c.types.includes('postal_code'));
    const pincode = pincodeComp ? pincodeComp.long_name : '';

    if (!pincode) {
      toast.error("Could not detect pincode. Please try another spot.");
      return false;
    }

    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/check-serviceability/${pincode}`);
      if (!data.serviceable) {
        toast.error(`Oops, we do not serve this area currently. We will be live soon and keep you informed`, {
          duration: 4000,
          icon: '📍'
        });
        return false;
      }
      return true;
    } catch (err) {
      console.error('Serviceability check failed', err);
      // If the API fails, maybe allow for now or strict? Let's be strict.
      return true; // Or false based on preference. Let's allow if API fails but keep it logged.
    }
  };

  const selectSuggestion = async (suggestion: any) => {
    if (!geocodingLibrary) return;
    try {
        const place = suggestion.placePrediction;
        const geocoder = new geocodingLibrary.Geocoder();
        const results = await geocoder.geocode({ placeId: place.placeId });
        if (results.results[0]) {
            const isServiceableResult = await checkPincode(results.results);
            const loc = results.results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            const address = results.results[0].formatted_address;

            if (!isServiceableResult) {
                setSelectedAddress('');
                setSearchTerm('Oops, we do not serve this area currently. We will be live soon and keep you informed');
                setIsServiceable(false);
                return;
            }

            setMapCenter({ lat, lng });
            setSelectedAddress(address);
            setSearchTerm(address);
            setIsServiceable(true);
            setSuggestions([]);
            
            if (showAddForm) {
                setNewAddrText(address);
                setNewAddrCoords([lng, lat]);
            }
        }
    } catch (err) {
        toast.error("Error fetching location details");
    }
  };



  const handleMapClick = async (e: any) => {
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;
    setMapCenter({ lat, lng });
    
    if (geocodingLibrary) {
        const geocoder = new geocodingLibrary.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, async (results, status) => {
          if (status === "OK" && results?.[0]) {
            const isServiceableResult = await checkPincode(results);
            const address = results[0].formatted_address;

            if (!isServiceableResult) {
              setSelectedAddress('');
              setSearchTerm('Oops, we do not serve this area currently. We will be live soon and keep you informed');
              setIsServiceable(false);
              return;
            }

            setSelectedAddress(address);
            setSearchTerm(address);
            setIsServiceable(true);
            if (showAddForm) {
              setNewAddrText(address);
              setNewAddrCoords([lng, lat]);
            }
          }
        });
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
      setMapCenter({ lat: latitude, lng: longitude });
      
      if (geocodingLibrary) {
        const geocoder = new geocodingLibrary.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, async (results, status) => {
          if (status === "OK" && results?.[0]) {
            const isServiceableResult = await checkPincode(results);
            if (!isServiceableResult) {
              setIsLocating(false);
              setIsServiceable(false);
              setSelectedAddress('');
              setSearchTerm('Oops, we do not serve this area currently. We will be live soon and keep you informed');
              return;
            }

            const address = results[0].formatted_address;
            setIsServiceable(true);
            setSelectedAddress(address);
            setSearchTerm(address);
            setIsLocating(false);
            
            if (step === 1) {
              onSelectAddress(address, [longitude, latitude]);
              onClose();
            }
          } else {
            toast.error('Failed to get address');
            setIsLocating(false);
          }
        });
      }
    }, () => {
      setIsLocating(false);
      toast.error('Location access denied');
    });
  };


  const confirmLocation = () => {
    onSelectAddress(selectedAddress || searchTerm, [mapCenter.lng, mapCenter.lat]);
    onClose();
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrCoords || !newAddrText) {
        toast.error('Please select a valid location on the map');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formattedAddress = `${houseNumber ? houseNumber + ', ' : ''}${floor ? 'Floor ' + floor + ', ' : ''}${tower ? tower + ', ' : ''}${newAddrText}${landmark ? ' (Near ' + landmark + ')' : ''}`;
        
        const newJobsite = {
            name: newAddrName || newAddrType || 'My Address',
            addressType: newAddrType,
            addressText: formattedAddress,
            contactPhone: newAddrPhone,
            location: {
                type: 'Point',
                coordinates: newAddrCoords // [longitude, latitude]
            }
        };

        // Fetch fresh user data from localStorage to avoid stale spread
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedJobsites = [...(currentUser.jobsites || []), newJobsite];
        
        console.log('Saving address:', newJobsite);

        const { data } = await axios.put(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
            { jobsites: updatedJobsites },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        localStorage.setItem('user', JSON.stringify(data));
        toast.success('Address saved to profile');
        onSelectAddress(formattedAddress, newAddrCoords);
        onClose();
    } catch (err: any) {
        console.error('Save address error:', err.response?.data || err.message);
        toast.error(err.response?.data?.message || 'Failed to save address. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div className="location-modal-content" onClick={e => e.stopPropagation()}>
        <div className="location-modal-header">
          <h2>Select delivery location</h2>
          <button type="button" className="close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}><X size={24} /></button>
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
                    <button className="decision-btn yellow" onClick={() => { setStep(2); setSearchTerm(''); }}>
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
                  {searchTerm && (
                    <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')}>
                      <X size={16} />
                    </button>
                  )}
                  {isSearching && <Loader2 size={18} className="animate-spin" />}
                </div>

                {suggestions.length > 0 && (
                  <div className="search-suggestions floating">
                    {suggestions.map((item, idx) => (
                      <div key={idx} className="suggestion-row" onClick={() => selectSuggestion(item)}>
                        <MapPin size={18} className="pin-icon" />
                        <div className="suggestion-details">
                          <p className="main-text">{item.placePrediction.mainText.text}</p>
                          <p className="sub-text">{item.placePrediction.text.text}</p>
                        </div>
                        <ChevronRight size={18} />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="empty-search-state-wrapper">
                  <div className="empty-search-state" onClick={handleUseCurrentLocation}>
                      <Navigation size={20} />
                      <span>Use current location</span>
                  </div>
                  
                    <div className="map-display-container">
                      <Map
                        style={{ width: '100%', height: '100%' }}
                        defaultCenter={mapCenter}
                        defaultZoom={15}
                        onClick={handleMapClick}
                        mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        onCameraChanged={(e: any) => {
                           const c = e.detail.center;
                           if (c) setMapCenter({ lat: c.lat, lng: c.lng });
                        }}
                      >
                        <MapMarker position={mapCenter} />
                      </Map>
                      
                      <button className="locate-me-btn-overlay" onClick={() => {
                        if (navigator.geolocation) {
                          toast.loading("Detecting your location...", { id: 'geo-loc' });
                          navigator.geolocation.getCurrentPosition((pos) => {
                            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            setMapCenter(newLoc);
                            toast.success("Location found!", { id: 'geo-loc' });
                            
                            if (geocodingLibrary) {
                              const geocoder = new geocodingLibrary.Geocoder();
                              geocoder.geocode({ location: newLoc }, (res: any, status: string) => {
                                if (status === 'OK' && res?.[0]) {
                                  setSearchTerm(res[0].formatted_address);
                                  setSelectedAddress(res[0].formatted_address);
                                }
                              });
                            }
                          }, () => {
                             toast.error("Could not find location", { id: 'geo-loc' });
                          });
                        }
                      }}>
                        <Navigation size={20} />
                      </button>

                    <div className="map-overlay-hint">
                      <MapPin size={14} /> Tap map to move pin
                    </div>
                  </div>

                  {(selectedAddress || searchTerm) && (
                    <button 
                      className="confirm-loc-btn" 
                      onClick={confirmLocation} 
                      disabled={!isServiceable || !selectedAddress}
                      style={{ opacity: (!isServiceable || !selectedAddress) ? 0.5 : 1, cursor: (!isServiceable || !selectedAddress) ? 'not-allowed' : 'pointer' }}
                    >
                      Confirm Location
                    </button>
                  )}

                </div>
                <button type="button" className="back-link-btn" onClick={() => setStep(1)}>Back</button>
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
              
              <div className="search-container-relative">
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
                          <p className="main-text">{item.placePrediction.mainText.text}</p>
                          <p className="sub-text">{item.placePrediction.text.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddAddress}>
                {newAddrText && (
                  <div className="selected-base-addr-display">
                    <MapPin size={16} className="pin-icon" />
                    <div className="addr-content">
                      <span className="label">Selected Location</span>
                      <p className="address">{newAddrText}</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Who are you ordering for?</label>
                  <div className="ordering-for-toggle">
                     <button 
                        type="button" 
                        className={`toggle-btn ${orderingFor === 'Yourself' ? 'active' : ''}`}
                        onClick={() => {
                           setOrderingFor('Yourself');
                           setNewAddrName(user.fullName || '');
                           setNewAddrPhone(user.phoneNumber || '');
                        }}
                     >
                        Yourself
                     </button>
                     <button 
                        type="button" 
                        className={`toggle-btn ${orderingFor === 'Someone else' ? 'active' : ''}`}
                        onClick={() => {
                           setOrderingFor('Someone else');
                           setNewAddrName('');
                           setNewAddrPhone('');
                        }}
                     >
                        Someone else
                     </button>
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
