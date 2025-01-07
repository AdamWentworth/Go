// LocationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');

  // We add this flag to avoid repeating the initial location fetch multiple times
  const [didInitialLocationFetch, setDidInitialLocationFetch] = useState(false);

  const { user, isLoading, updateUserDetails } = useAuth();

  useEffect(() => {
    let intervalId;

    const fetchLocation = () => {
      // 1) If we're still loading user info, don't fetch location
      if (isLoading) {
        console.log("Still loading user info, skipping location fetching.");
        return;
      }

      // 2) If there's no user, clear out location
      if (!user) {
        console.log("User not logged in. Skipping location fetching.");
        setLocationStatus('unavailable');
        setLocation(null);
        localStorage.removeItem('location');
        return;
      }

      // 3) If user.allowLocation is true, do auto location
      if (user.allowLocation) {
        console.log("User has allowed automatic location acquisition.");

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            // Update local state + localStorage
            setLocation(coords);
            setLocationStatus('available');
            localStorage.setItem('location', JSON.stringify(coords));
            console.log(
              `Location acquired and stored. Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`
            );

            // Compare new coords to user's stored coords
            const userLat = user.coordinates?.latitude;
            const userLong = user.coordinates?.longitude;
            const coordsChanged =
              userLat !== coords.latitude || userLong !== coords.longitude;

            if (coordsChanged) {
              console.log("Coordinates have changed, updating user in DB...");
              const updateResult = await updateUserDetails(user.user_id, {
                coordinates: coords,
              });

              if (!updateResult.success) {
                console.error(
                  "Failed to update user coordinates in DB:",
                  updateResult.error
                );
                toast.error("Failed to update your coordinates in the DB.");
              } else {
                console.log("Coordinates updated in main & secondary DB!");
              }
            }
          },
          (error) => {
            console.error("Error acquiring location:", error);
            toast.error(
              "Location services are disabled or unavailable. Please enable location services in your browser."
            );
            setLocationStatus('unavailable');
            setLocation(null);
            localStorage.removeItem('location');
          }
        );
      } else {
        // 4) If user disallowed automatic location acquisition
        console.log(
          "User has disabled automatic location acquisition. Using manual coordinates if available."
        );

        if (
          user.coordinates &&
          typeof user.coordinates.latitude === "number" &&
          typeof user.coordinates.longitude === "number"
        ) {
          const manualCoords = {
            latitude: user.coordinates.latitude,
            longitude: user.coordinates.longitude,
          };
          setLocation(manualCoords);
          setLocationStatus('available');
          localStorage.setItem('location', JSON.stringify(manualCoords));
          console.log(
            `Manual location set. Latitude: ${manualCoords.latitude}, Longitude: ${manualCoords.longitude}`
          );
        } else {
          console.log("No manual coordinates provided by user.");
          setLocationStatus('unavailable');
          setLocation(null);
          localStorage.removeItem('location');
        }
      }
    };

    // We do the INITIAL location fetch once user is loaded
    // and if we haven't done it yet.
    if (!isLoading && user && !didInitialLocationFetch) {
      fetchLocation();
      setDidInitialLocationFetch(true);

      // After the initial fetch, set interval to refresh location every hour
      intervalId = setInterval(() => {
        console.log("Refreshing location...");
        fetchLocation();
      }, 60 * 60 * 1000); // 1 hour
    }

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isLoading, didInitialLocationFetch, updateUserDetails]);

  return (
    <LocationContext.Provider value={{ location, locationStatus }}>
      {children}
    </LocationContext.Provider>
  );
};
