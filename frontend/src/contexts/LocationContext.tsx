import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export interface Location {
  address: string;
  coords: { lat: number; lng: number };
  isServiceable: boolean;
  matchingJobsite?: any;
  isManual?: boolean; // Signal that user specifically chose this
}

interface LocationContextType {
  location: Location | null;
  setLocation: (loc: Location, isManual?: boolean) => void;
  detectLocation: (force?: boolean) => Promise<void>;
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
  return user.jobsites.find((site: { location?: { coordinates: [number, number] }, addressText: string, _id: string }) => {
    if (!site.location?.coordinates) return false;
    const [sLng, sLat] = site.location.coordinates;
    return calculateDistance(lat, lng, sLat, sLng) < THRESHOLD;
  });
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const geocodingLibrary = useMapsLibrary('geocoding');

  const setLocation = (loc: Location, isManual = false) => {
    // If setting manually, we protect it from auto-background resets
    const finalLoc = { ...loc, isManual };
    setLocationState(finalLoc);
  };

  // const checkServiceability = async (pincode: string, city: string) => {
  //   try {
  //     const query = pincode || city;
  //     if (!query) return false;
  //     const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/location/check-serviceability/${encodeURIComponent(query)}`);
  //     return !!data.serviceable;
  //   } catch (err) {
  //     console.error('Serviceability check failed:', err);
  //     return false;
  //   }
  // };

  const checkGeofenceServiceability = async (lat: number, lng: number) => {
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/location/check-coordinates`, { lat, lng });
      return !!data.serviceable;
    } catch (err) {
      console.error('Geofence check failed:', err);
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
        // const pincodeComp = result.address_components.find((c: any) => c.types.includes('postal_code'));
        // const cityComp = result.address_components.find((c: any) => c.types.includes('locality')) || 
                        // result.address_components.find((c: any) => c.types.includes('administrative_area_level_2'));
        // const pincode = pincodeComp ? pincodeComp.long_name : '';
        // const city = cityComp ? cityComp.long_name : '';
        
        // Geofence check (Dynamic from drawn polygons)
        const isServiceable = await checkGeofenceServiceability(lat, lng);
        return { address, isServiceable };
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  }, [geocodingLibrary]);

  const detectLocation = useCallback(async (force = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const match = findMatchingAddress(latitude, longitude);
        const result = await getAddressFromCoords(latitude, longitude);
        
        if (result) {
          const finalLoc = {
            address: match ? match.addressText : result.address,
            coords: { lat: latitude, lng: longitude },
            isServiceable: result.isServiceable,
            matchingJobsite: match,
            isManual: force // If forced, mark as manual
          };
          setLocationState(finalLoc);
        }
        setIsLocating(false);
      },
      (err) => {
        setError(err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [getAddressFromCoords]);

  // Handle Startup Detection
  useEffect(() => {
    if (geocodingLibrary && !location) {
      detectLocation();
    }
  }, [geocodingLibrary, detectLocation, location]);

  // Handle Background Tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const match = findMatchingAddress(latitude, longitude);

        setLocationState((currentLoc: Location | null) => {
            // STOP auto-switching if user manually picked an address
            if (currentLoc?.isManual) return currentLoc;

            if (currentLoc) {
                const distToCurrent = calculateDistance(latitude, longitude, currentLoc.coords.lat, currentLoc.coords.lng);
                
                // If we match a jobsite now, update if it's different from current
                if (match) {
                    if (currentLoc.matchingJobsite?._id !== match._id) {
                        const finalLoc = {
                            address: match.addressText,
                            coords: { lat: latitude, lng: longitude },
                            isServiceable: true,
                            matchingJobsite: match,
                            isManual: false
                        };
                        return finalLoc;
                    }
                } 
                
                // If we moved > 200m and aren't at a jobsite, re-detect generic address
                if (distToCurrent > 200 && !match) {
                    // Trigger async geocode but don't block state return
                    getAddressFromCoords(latitude, longitude).then(res => {
                        if (res) {
                            setLocationState({
                                address: res.address,
                                coords: { lat: latitude, lng: longitude },
                                isServiceable: res.isServiceable,
                                matchingJobsite: null,
                                isManual: false
                            });
                        }
                    });
                }
            }
            return currentLoc;
        });
      },
      null,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [location, getAddressFromCoords]);

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
