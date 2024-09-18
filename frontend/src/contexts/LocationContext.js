// LocationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkLocationPermissionAndFetch = async () => {
      if (isLoading) {
        console.log("Still loading user info, skipping location fetching.");
        return;  // Wait until loading is finished
      }
  
      if (!user) {
        console.log("User not logged in. Skipping location fetching.");
        setLocationStatus('unavailable');
        return;
      }
  
      // If user is logged in but hasn't allowed location
      if (!user.allowLocation) {
        console.log("User has not allowed location. Skipping location fetching.");
        setLocationStatus('unavailable');
        return;
      }
  
      // Check if location is already stored in localStorage
      const storedLocation = localStorage.getItem('location');
      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        console.log(`Location already stored. Latitude: ${parsedLocation.latitude}, Longitude: ${parsedLocation.longitude}`);
        setLocation(parsedLocation);
        setLocationStatus('available');
        return;
      }
  
      // If no location is stored, request it
      try {
        console.log("Requesting location...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = position.coords;
            localStorage.setItem('location', JSON.stringify(coords));
            setLocation(coords);
            setLocationStatus('available');
            console.log(`Location acquired and stored. Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
          },
          (error) => {
            console.error("Error acquiring location:", error);
            toast.error('Location services are disabled in your browser. Please enable location services in your browser settings to use location-based features.');
            setLocationStatus('unavailable');
          }
        );
      } catch (error) {
        console.error("Error accessing geolocation:", error);
        setLocationStatus('unavailable');
      }
    };
  
    if (!isLoading && user) {
      checkLocationPermissionAndFetch(); // Call the function after user status and loading state is resolved
    }
  }, [user, isLoading]);  

  return (
    <LocationContext.Provider value={{ location, locationStatus }}>
      {children}
    </LocationContext.Provider>
  );
};