// LocationPermission.js

import { useEffect, useState } from 'react';
import { useLocation } from '../../../contexts/LocationContext';
import LocationPopup from './LocationPopup';

const LocationPermission = () => {
  const { handleLocationPermission } = useLocation();
  const [locationStatus, setLocationStatus] = useState('checking');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      const userLocation = await handleLocationPermission(setShowPopup);
      if (userLocation) {
        console.log(`Latitude: ${userLocation.latitude}, Longitude: ${userLocation.longitude}`);
        setLocationStatus('available');
      } else {
        console.log('Location data not available or user denied permission.');
        setLocationStatus('unavailable');
      }
    };

    getLocation();
  }, [handleLocationPermission]);

  const handleConfirm = () => {
    setShowPopup(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location acquired:", position);
        setLocationStatus('available');
      },
      (error) => {
        console.error("Error acquiring location:", error);
        setLocationStatus('unavailable');
      }
    );
  };

  const handleCancel = () => {
    setShowPopup(false);
    setLocationStatus('unavailable');
    localStorage.setItem('locationPermissionDenied', 'true');
  };

  return (
    <>
      {showPopup && <LocationPopup onConfirm={handleConfirm} onCancel={handleCancel} />}
    </>
  );
};

export default LocationPermission;
