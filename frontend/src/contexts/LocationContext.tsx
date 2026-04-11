import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export interface Location {
  address: string;
  coords: { lat: number; lng: number };
  isServiceable: boolean;
  matchingJobsite?: any; // To store a linked saved address
}

interface LocationContextType {
  location: Location | null;
  setLocation: (loc: Location) => void;
  detectLocation: () => Promise<void>;
  isLocating: boolean;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Helper to calculate distance in meters
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

const findMatchingAddress = (lat: number, lng: number) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  if (!user.jobsites || !Array.isArray(user.jobsites)) return null;

  const THRESHOLD = 50; // 50 meters
  return user.jobsites.find((site: any) => {
    if (!site.location?.coordinates) return false;
    const [sLng, sLat] = site.location.coordinates;
    return calculateDistance(lat, lng, sLat, sLng) < THRESHOLD;
  });
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<Location | null>(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const geocodingLibrary = useMapsLibrary('geocoding');

  const setLocation = (loc: Location) => {
    // Before setting, check if it matches a saved address
    const match = findMatchingAddress(loc.coords.lat, loc.coords.lng);
    const finalLoc = { ...loc, matchingJobsite: match || loc.matchingJobsite };
    
    setLocationState(finalLoc);
    localStorage.setItem('user_location', JSON.stringify(finalLoc));
  };

  const checkServiceability = async (pincode: string, city: string) => {
    try {
      const query = pincode || city;
      if (!query) return false;

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/check-serviceability/${encodeURIComponent(query)}`
      );
      return !!data.serviceable;
    } catch (err) {
      console.error('Serviceability check failed:', err);
      return false;
    }
  };

  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    if (!geocodingLibrary) return null;
    
    const geocoder = new geocodingLibrary.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        const result = response.results[0];
        const address = result.formatted_address;
        
        const pincodeComp = result.address_components.find((c: any) => c.types.includes('postal_code'));
        const cityComp = result.address_components.find((c: any) => c.types.includes('locality')) || 
                        result.address_components.find((c: any) => c.types.includes('administrative_area_level_2'));
        
        const pincode = pincodeComp ? pincodeComp.long_name : '';
        const city = cityComp ? cityComp.long_name : '';

        const isServiceable = await checkServiceability(pincode, city);
        return { address, isServiceable };
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  }, [geocodingLibrary]);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const result = await getAddressFromCoords(latitude, longitude);
          if (result) {
            const match = findMatchingAddress(latitude, longitude);
            setLocation({
              address: match ? match.addressText : result.address,
              coords: { lat: latitude, lng: longitude },
              isServiceable: result.isServiceable,
              matchingJobsite: match
            });
          }
          setIsLocating(false);
          resolve();
        },
        (err) => {
          setError(err.message);
          setIsLocating(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, [getAddressFromCoords]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // Use a reference check or just local variable to avoid dependency loop
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Find if this current spot in the background matches any saved jobsite
        const match = findMatchingAddress(latitude, longitude);
        
        setLocationState((currentLoc: Location | null) => {
            // Priority 1: If we found a saved jobsite match in the background
            if (match) {
                // Only update if it's different from what's currently set
                if (!currentLoc || 
                    currentLoc.matchingJobsite?._id !== match._id || 
                    Math.abs(currentLoc.coords.lat - latitude) > 0.001) {
                    
                    const finalLoc = {
                        address: match.addressText,
                        coords: { lat: latitude, lng: longitude },
                        isServiceable: true,
                        matchingJobsite: match
                    };
                    localStorage.setItem('user_location', JSON.stringify(finalLoc));
                    return finalLoc;
                }
                return currentLoc;
            }

            // Priority 2: If we don't have a match and NO manual location is set yet, detect generic address
            if (!currentLoc) {
                // We'll let the user manually trigger this or handle in a separate effect
                // To avoid flickering, background watch should mostly look for saved matches
                return currentLoc;
            }

            return currentLoc;
        });
      },
      (err) => console.warn('WatchPosition error:', err),
      { enableHighAccuracy: true, distanceFilter: 10 } as any 
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []); // Remove getAddressFromCoords and location to stop the loop

  useEffect(() => {
    if (!location && geocodingLibrary) {
      detectLocation();
    }
  }, [location, geocodingLibrary, detectLocation]);

  return (
    <LocationContext.Provider value={{ location, setLocation, detectLocation, isLocating, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
