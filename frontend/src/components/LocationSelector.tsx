import React, { useState } from 'react';
import { ChevronDown, User, Loader2, Mic } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationModal from './LocationModal';
import { useLocationContext } from '../contexts/LocationContext';
import logoImg from '../assets/logo.jpeg';
import './locationSelector.css';

interface LocationSelectorProps {
  searchNode?: React.ReactNode;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ searchNode }) => {
  const { location, setLocation, isLocating } = useLocationContext();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');
  const navigate = useNavigate();

  const displayAddress = location?.matchingJobsite 
    ? (`${location.matchingJobsite.name}: ${location.matchingJobsite.addressText}`)
    : (location?.address || 'Detecting location...');

  const shortAddress = location?.matchingJobsite?.name || location?.address?.split(',')[0] || 'Detecting...';

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
    setLocation({
      address: addrText,
      coords: { lat: coords[1], lng: coords[0] },
      isServiceable: true
    });
    if (isLoggedIn) {
      updateBackendAddress(addrText, coords);
    }
  };

  return (
    <>
      <div className="landing-header">
        <div className="header-top-row">
          <div className="header-left-group">
            <img src={logoImg} alt="MatAll" className="logo-mobile" />
            <div className="location-wrapper">
              <span className="delivery-time-mobile">Delivery in 60 minutes</span>
              <div className="location-section-landing" onClick={() => setIsModalOpen(true)}>
                <span className="addr-landing">{shortAddress}</span>
                {isLocating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </div>
          </div>
          
          <Link to={isLoggedIn ? "/profile" : "/login"} className="profile-btn-circle">
            <User size={22} />
          </Link>
        </div>

        <div className="search-row-mobile">
          {searchNode || (
            <div className="search-bar-landing" onClick={() => navigate('/search')}>
              <input type="text" placeholder="Search your product" readOnly />
              <Mic size={20} className="mic-icon-landing" />
            </div>
          )}
        </div>
      </div>

      <LocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectAddress={handleSelectAddress}
        currentAddress={displayAddress}
      />
    </>
  );
};

export default LocationSelector;
