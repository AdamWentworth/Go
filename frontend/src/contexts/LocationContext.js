// LocationContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const fetchLocation = () => {
      const storedLocation = localStorage.getItem('location');
      const locationPermissionDenied = localStorage.getItem('locationPermissionDenied');

      if (storedLocation) {
        const parsedLocation = JSON.parse(storedLocation);
        console.log(`Latitude: ${parsedLocation.latitude}, Longitude: ${parsedLocation.longitude}`);
        setLocation(parsedLocation);
      } else if (locationPermissionDenied && !user) {
        console.log("Location permission previously denied for non-logged-in user.");
      }
    };

    if (!isLoading && user !== undefined) {
      fetchLocation();
    }
  }, [user, isLoading]);

  const handleLocationPermission = async (showPopupCallback) => {
    if (isLoading || user === undefined) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for the user data to fully load
      return handleLocationPermission(showPopupCallback); // Recursively call again after waiting
    }

    const storedLocation = localStorage.getItem('location');
    if (storedLocation) {
      console.log("Location already set.");
      return JSON.parse(storedLocation);
    }

    const locationPermissionDenied = localStorage.getItem('locationPermissionDenied');
    if (locationPermissionDenied && !user) {
      console.log("Location permission previously denied for non-logged-in user.");
      return null;
    }

    if (!user) {
      console.log("User not logged in. Prompting for location permission.");
      showPopupCallback(true);
      return null;
    } else {
      console.log("User logged in. Checking allowLocation:", user.allowLocation);
      if (user.allowLocation) {
        console.log("User allowed location. Acquiring location.");
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log("Location acquired:", position);
              const coords = position.coords;
              localStorage.setItem('location', JSON.stringify(coords));
              setLocation(coords);
              resolve(coords);
            },
            (error) => {
              console.error("Error acquiring location:", error);
              toast.error('Location services are disabled in your browser. Please enable location services in your browser settings to use location-based features.');
              resolve(null);
            }
          );
        });
      } else {
        console.log("User did not allow location. Doing nothing.");
        return null;
      }
    }
  };

  return (
    <LocationContext.Provider value={{ location, handleLocationPermission }}>
      {children}
    </LocationContext.Provider>
  );
};