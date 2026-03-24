import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, User, Loader2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import LocationModal from './LocationModal';
import './locationSelector.css';

const LocationSelector: React.FC = () => {
  const [address, setAddress] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  const { cart } = useCart();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    // If logged in and has jobsites, use the first one
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

          // If logged in, update backend (only if they don't have any jobsites yet)
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
      <div className="location-selector">
        <div className="location-info" onClick={() => setIsModalOpen(true)}>
          <div className="delivery-time">Delivery in 60 minutes</div>
          <div className="address-container">
            <span className="address-text" title={address}>
              {address}
            </span>
            {isLocating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ChevronDown size={14} className="chevron" />
            )}
          </div>
        </div>

        <div className="header-actions-mobile">
          <Link to="/cart" className="action-icon-mobile">
            <ShoppingCart size={24} />
            {cart.length > 0 && <span className="mobile-cart-badge">{cart.length}</span>}
          </Link>
          <Link to={isLoggedIn ? "/profile" : "/login"} className="action-icon-mobile profile-bg">
            <User size={24} />
          </Link>
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
