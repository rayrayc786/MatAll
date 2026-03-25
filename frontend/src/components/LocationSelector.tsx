import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, User, Loader2, Mic } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationModal from './LocationModal';
import './locationSelector.css';

const LocationSelector: React.FC = () => {
  const [address, setAddress] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && user.jobsites && user.jobsites.length > 0) {
      setAddress(user.jobsites[0].addressText);
    } else {
      detectLocation();
    }
  }, [isLoggedIn]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setAddress('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const addressData = data.address;
          const conciseAddr = addressData.suburb || addressData.neighbourhood || addressData.city_district || addressData.town || addressData.city;
          const fullAddress = conciseAddr ? `${conciseAddr}, ${addressData.city || addressData.state || ''}` : data.display_name;
          setAddress(fullAddress);

          if (isLoggedIn && (!user.jobsites || user.jobsites.length === 0)) {
            updateBackendAddress(fullAddress, [longitude, latitude]);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setAddress(`Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setAddress('Location access denied');
        setIsLocating(false);
      }
    );
  };

  const updateBackendAddress = async (addrText: string, coords: [number, number]) => {
    try {
      const token = localStorage.getItem('token');
      const newJobsite = {
        name: 'Current Location',
        addressType: 'Other',
        addressText: addrText,
        location: {
          type: 'Point',
          coordinates: coords
        }
      };
      
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`,
        { jobsites: [newJobsite, ...(user.jobsites || []).filter((s: any) => s.addressText !== addrText)] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to update BE address:', err);
    }
  };

  const handleSelectAddress = (addrText: string, coords: [number, number]) => {
    setAddress(addrText);
    if (isLoggedIn) {
      updateBackendAddress(addrText, coords);
    }
  };

  return (
    <>
      <div className="landing-header">
        <div className="header-top-row">
          <div className="location-section-landing" onClick={() => setIsModalOpen(true)}>
            <MapPin size={20} className="pin-icon-landing" />
            <div className="location-text-landing">
              <span className="addr-landing">{address}</span>
              {isLocating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ChevronDown size={14} />
              )}
            </div>
          </div>
          
          <Link to={isLoggedIn ? "/profile" : "/login"} className="profile-btn-circle">
            <User size={22} />
          </Link>
        </div>

        <div className="search-bar-landing" onClick={() => navigate('/search')}>
          <input type="text" placeholder="Search your product" readOnly />
          <Mic size={20} className="mic-icon-landing" />
        </div>
      </div>

      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectAddress={handleSelectAddress}
        currentAddress={address}
      />
    </>
  );
};

export default LocationSelector;
