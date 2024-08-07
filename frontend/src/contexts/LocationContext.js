// LocationContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const storedLocation = localStorage.getItem('location');
    const locationPermissionDenied = localStorage.getItem('locationPermissionDenied');

    if (storedLocation) {
      setLocation(JSON.parse(storedLocation));
    } else if (locationPermissionDenied) {
      console.log("Location permission previously denied.");
      setLocation(null);
    }
  }, []);

  const handleLocationPermission = async (showPopupCallback) => {
    // Wait until the user data is fully loaded
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms before checking again
    }

    const locationPermissionDenied = localStorage.getItem('locationPermissionDenied');
    if (locationPermissionDenied) {
      console.log("Location permission previously denied.");
      return null;
    }

    if (location) {
      console.log("Location already set.");
      return location;
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
              setLocation(position.coords);
              localStorage.setItem('location', JSON.stringify(position.coords));
              resolve(position.coords);
            },
            (error) => {
              console.error("Error acquiring location:", error);
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
