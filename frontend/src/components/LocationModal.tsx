import React, { useState, useEffect } from 'react';
import { Search, MapPin, Navigation, X, Home, Map as MapIcon, Loader2, ChevronRight, Mic, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Map, Marker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { useLocationContext } from '../contexts/LocationContext';
import './locationModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coords: [number, number]) => void;
  currentAddress?: string;
  initialData?: any;
  editIndex?: number | null;
}

const LocationModal: React.FC<LocationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectAddress, 
  currentAddress,
  initialData,
  editIndex
}) => {
  const { location: globalLocation } = useLocationContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Decision, 2: Search/Selection
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => {
    if (globalLocation?.coords) return globalLocation.coords;
    return { lat: 28.6139, lng: 77.2090 };
  });
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
  const [apartmentName, setApartmentName] = useState('');
  const [orderingFor, setOrderingFor] = useState<'Yourself' | 'Someone else'>('Yourself');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');

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
    if (showAddForm) {
      if (!newAddrText && (selectedAddress || searchTerm || currentAddress)) {
        const addr = selectedAddress || searchTerm || currentAddress || '';
        setNewAddrText(addr);
        setNewAddrCoords([mapCenter.lng, mapCenter.lat]);
        
        // Try to extract pincode and city if not already set
        if (!pincode || !city) {
           const match = addr.match(/\b\d{6}\b/);
           if (match && !pincode) setPincode(match[0]);
           
           if (!city) {
             const parts = addr.split(',').map(p => p.trim());
             if (parts.length >= 3) {
               // Usually: ... [City], [State] [Pincode], [Country]
               setCity(parts[parts.length - 3]);
             } else if (parts.length === 2) {
               // e.g. [City], [Country]
               setCity(parts[0]);
             }
           }
        }
      }
    }
  }, [showAddForm, selectedAddress, searchTerm, currentAddress, mapCenter, pincode, city]);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        if (initialData) {
            // Edit Mode logic
            setStep(2);
            setShowAddForm(true);
            setNewAddrName(initialData.name || '');
            setNewAddrType(initialData.addressType || 'Home');
            setNewAddrText(initialData.addressText || '');
            setNewAddrPhone(initialData.contactPhone || '');
            setNewAddrCoords(initialData.location?.coordinates || null);
            setPincode(initialData.pincode || '');
            setCity(initialData.city || '');
            setStateName(initialData.state || '');
            if (initialData.location?.coordinates) {
                setMapCenter({ 
                    lat: initialData.location.coordinates[1], 
                    lng: initialData.location.coordinates[0] 
                });
            }
            setSearchTerm(initialData.addressText || '');
            setSelectedAddress(initialData.addressText || '');
        } else {
            // New Mode - RESET
            // We only initialize from globalLocation if we haven't already started a selection
            // or if we are just opening the modal.
            setStep(1);
            setShowAddForm(false);
            setNewAddrName('');
            setNewAddrType('Home');
            setNewAddrText('');
            setNewAddrPhone('');
            setNewAddrCoords(null);
            setHouseNumber('');
            setFloor('');
            setTower('');
            setLandmark('');
            setDirections('');
            setApartmentName('');
            
            if (globalLocation) {
                setMapCenter(globalLocation.coords);
                setSearchTerm(globalLocation.address);
                setSelectedAddress(globalLocation.address);
                setIsServiceable(globalLocation.isServiceable);
            } else if (currentAddress) {
                setSearchTerm(currentAddress);
            }
        }
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData, currentAddress]); // Removed globalLocation to stop background resets

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const findMatchingSavedAddress = (lat: number, lng: number) => {
    if (!isLoggedIn || !user?.jobsites) return null;
    const THRESHOLD = 50; // 50 meters
    return user.jobsites.find((site: any) => {
      if (!site.location?.coordinates) return false;
      const [sLng, sLat] = site.location.coordinates;
      return calculateDistance(lat, lng, sLat, sLng) < THRESHOLD;
    });
  };

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
            
            // Filter locally to only show specific locations that likely have a pincode
            // We exclude generic localities/political boundaries.
            const filtered = ((results as any) || []).filter((item: any) => {
                const types = item?.placePrediction?.types || [];
                return types.includes('address') || 
                       types.includes('establishment') || 
                       types.includes('point_of_interest') || 
                       types.includes('premise') ||
                       types.includes('school') ||
                       types.includes('university') ||
                       types.includes('sublocality') ||
                       types.includes('postal_code');
            });
            setSuggestions(filtered);
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
    let pincodeVal = pincodeComp ? pincodeComp.long_name : '';

    if (!pincodeVal && results[0].formatted_address) {
        const match = results[0].formatted_address.match(/\b\d{6}\b/);
        if (match) pincodeVal = match[0];
    }

    const localityComp = addressComponents.find((c: any) => c.types.includes('locality')) || 
                         addressComponents.find((c: any) => c.types.includes('administrative_area_level_2'));
    const cityVal = localityComp ? localityComp.long_name : '';

    const stateComp = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'));
    const stateVal = stateComp ? stateComp.long_name : '';

    setPincode(pincodeVal);
    setCity(cityVal);
    setStateName(stateVal);

    if (!pincodeVal && !cityVal) {
      toast.error("Could not detect location. Please try a more specific spot.");
      return false;
    }

    try {
      const query = pincodeVal || cityVal;
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/location/check-serviceability/${encodeURIComponent(query)}`);
      
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
      toast.error("Area check currently unavailable. Please try again.");
      return false; 
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
                setIsServiceable(false);
                return;
            }

            setMapCenter({ lat, lng });
            
            // Check for saved match
            const match = findMatchingSavedAddress(lat, lng);
            if (match) {
               setSelectedAddress(match.addressText);
               setSearchTerm(match.addressText);
            } else {
               setSelectedAddress(address);
               setSearchTerm(address);
            }

            setIsServiceable(true);
            setSuggestions([]);
            
            if (showAddForm) {
                setNewAddrText(match ? match.addressText : address);
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
              setIsServiceable(false);
              return;
            }

            // Check for saved match
            const match = findMatchingSavedAddress(lat, lng);
            if (match) {
               setSelectedAddress(match.addressText);
               setSearchTerm(match.addressText);
            } else {
               setSelectedAddress(address);
               setSearchTerm(address);
            }

            setIsServiceable(true);
            if (showAddForm) {
              setNewAddrText(match ? match.addressText : address);
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const newCenter = { lat: latitude, lng: longitude };
          setMapCenter(newCenter);
          
          const match = findMatchingSavedAddress(latitude, longitude);
          
          if (match) {
            setIsServiceable(true);
            setSelectedAddress(match.addressText);
            setSearchTerm(match.addressText);
            setIsLocating(false);
            
            // Give feedback that we found a match
            toast.success(`Welcome back! Using your saved address: ${match.name}`, { icon: '📍' });
            
            // Instead of auto-closing, we select it and let the user see it on map
            // If they want to close, they can click "Confirm Location" which will appear now
            // or we can auto-close after a short delay for better UX
            setTimeout(() => {
                onSelectAddress(match.addressText, match.location.coordinates);
                onClose();
            }, 1000);
            return;
          }

          if (geocodingLibrary) {
            const geocoder = new geocodingLibrary.Geocoder();
            geocoder.geocode({ location: newCenter }, async (results, status) => {
              if (status === "OK" && results?.[0]) {
                const isServiceableResult = await checkPincode(results);
                if (!isServiceableResult) {
                  setIsLocating(false);
                  setIsServiceable(false);
                  setSelectedAddress('');
                  return;
                }

                const address = results[0].formatted_address;
                setIsServiceable(true);
                setSelectedAddress(address);
                setSearchTerm(address);
                setIsLocating(false);
                
                // Show the address form so user can add details
                setShowAddForm(true);
              } else {
                toast.error('Failed to get address from GPS');
                setIsLocating(false);
              }
            });
          } else {
            // Fallback if geocoding library isn't ready
            setIsLocating(false);
            toast.error('Location service not ready. Please try again.');
          }
        } catch (err) {
          console.error('Location detection error:', err);
          setIsLocating(false);
          toast.error('Error detecting location');
        }
      }, 
      (err) => {
        setIsLocating(false);
        let msg = 'Could not detect location';
        if (err.code === 1) msg = 'Location access denied. Please enable it in browser settings.';
        else if (err.code === 2) msg = 'Location signal unavailable. Try moving to a better spot.';
        else if (err.code === 3) msg = 'Location detection timed out. Please try again.';
        
        toast.error(msg, { duration: 5000 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };


  const confirmLocation = () => {
    const match = findMatchingSavedAddress(mapCenter.lat, mapCenter.lng);
    if (match) {
        onSelectAddress(match.addressText, match.location.coordinates);
        onClose();
    } else {
        setShowAddForm(true);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrCoords || !newAddrText) {
        toast.error('Please select a valid location on the map');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const formattedAddress = `${houseNumber ? houseNumber + ', ' : ''}${floor ? 'Floor ' + floor + ', ' : ''}${tower ? tower + ', ' : ''}${apartmentName ? apartmentName + ', ' : ''}${newAddrText}${landmark ? ' (Near ' + landmark + ')' : ''}`;
        
        const newJobsite = {
            name: newAddrName || newAddrType || 'My Address',
            addressType: newAddrType,
            addressText: formattedAddress,
            pincode: pincode,
            city: city,
            state: stateName,
            contactPhone: newAddrPhone,
            location: {
                type: 'Point',
                coordinates: newAddrCoords // [longitude, latitude]
            }
        };

        // Fetch fresh user data from localStorage to avoid stale spread
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        let updatedJobsites = [];
        
        if (editIndex !== undefined && editIndex !== null) {
            updatedJobsites = [...(currentUser.jobsites || [])];
            updatedJobsites[editIndex] = newJobsite;
        } else {
            updatedJobsites = [...(currentUser.jobsites || []), newJobsite];
        }
        
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
                        <div key={idx} className="saved-addr-mini" onClick={() => { onSelectAddress(site.addressText, site.location.coordinates); onClose(); }}>
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
                    <button type="button" className="clear-search-btn" onClick={() => { setSearchTerm(''); setSuggestions([]); }}>
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
                        center={mapCenter}
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
                    <label>Apartment/ Building Name (optional)</label>
                    <input type="text" value={apartmentName} onChange={e => setApartmentName(e.target.value)} placeholder="e.g. DLF Heights" />
                </div>

                <div className="form-group">
                    <label>Tower/ Block (optional)</label>
                    <input type="text" value={tower} onChange={e => setTower(e.target.value)} placeholder="e.g. Block B" />
                </div>

                <div className="form-group">
                    <label>Nearby Landmark</label>
                    <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="e.g. Near Petrol Pump" />
                </div>

                <div className="form-grid-2col">
                    <div className="form-group">
                        <label>PIN Code</label>
                        <input 
                            type="text" 
                            value={pincode} 
                            onChange={(e) => setPincode(e.target.value)} 
                            placeholder="e.g. 160062" 
                        />
                    </div>
                    <div className="form-group">
                        <label>City</label>
                        <input 
                            type="text" 
                            value={city} 
                            onChange={(e) => setCity(e.target.value)} 
                            placeholder="e.g. Sahibzada Ajit Singh Nagar" 
                        />
                    </div>
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
