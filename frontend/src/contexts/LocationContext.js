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
    let intervalId;

    // Function to fetch and set location based on user preferences
    const fetchLocation = () => {
      if (isLoading) {
        console.log("Still loading user info, skipping location fetching.");
        return; // Wait until loading is finished
      }

      if (!user) {
        console.log("User not logged in. Skipping location fetching.");
        setLocationStatus('unavailable');
        setLocation(null);
        localStorage.removeItem('location'); // Clear stored location if any
        return;
      }

      if (user.allowLocation) {
        // User allows automatic location acquisition
        console.log("User has allowed automatic location acquisition.");

        // Attempt to get location from browser
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(coords);
            setLocationStatus('available');
            localStorage.setItem('location', JSON.stringify(coords));
            console.log(`Location acquired and stored. Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
          },
          (error) => {
            console.error("Error acquiring location:", error);
            toast.error('Location services are disabled in your browser. Please enable location services in your browser settings to use location-based features.');
            setLocationStatus('unavailable');
            setLocation(null);
            localStorage.removeItem('location'); // Clear stored location if any
          }
        );
      } else {
        // User has disabled automatic location acquisition
        console.log("User has disabled automatic location acquisition. Using manual coordinates.");

        if (user.coordinates && typeof user.coordinates.latitude === 'number' && typeof user.coordinates.longitude === 'number') {
          const manualCoords = {
            latitude: user.coordinates.latitude,
            longitude: user.coordinates.longitude,
          };
          setLocation(manualCoords);
          setLocationStatus('available');
          localStorage.setItem('location', JSON.stringify(manualCoords));
          console.log(`Manual location set. Latitude: ${manualCoords.latitude}, Longitude: ${manualCoords.longitude}`);
        } else {
          console.log("No manual coordinates provided by user.");
          setLocationStatus('unavailable');
          setLocation(null);
          localStorage.removeItem('location'); // Clear stored location if any
        }
      }
    };

    if (!isLoading && user) {
      // Initial fetch
      fetchLocation();

      // Set interval to refresh location every hour (3600000 milliseconds)
      intervalId = setInterval(() => {
        console.log("Refreshing location...");
        fetchLocation();
      }, 60 * 60 * 1000); // 1 hour in milliseconds
    }

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isLoading]);

  return (
    <LocationContext.Provider value={{ location, locationStatus }}>
      {children}
    </LocationContext.Provider>
  );
};
