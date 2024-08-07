// LocationPermission.js

import { useEffect, useState } from 'react';
import { useLocation } from '../../../contexts/LocationContext';
import LocationPopup from './LocationPopup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LocationPermission = () => {
  const { handleLocationPermission, location } = useLocation();
  const [locationStatus, setLocationStatus] = useState('checking');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      const userLocation = await handleLocationPermission(setShowPopup);
      if (userLocation) {
        setLocationStatus('available');
      } else {
        setLocationStatus('unavailable');
      }
    };

    if (!location && locationStatus === 'checking') {
      getLocation();
    }
  }, [location, locationStatus, handleLocationPermission]);

  useEffect(() => {
    if (location) {
      setLocationStatus('available');
    }
  }, [location]);

  const handleConfirm = () => {
    setShowPopup(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        localStorage.setItem('location', JSON.stringify(position.coords));
        localStorage.removeItem('locationPermissionDenied');
      },
      (error) => {
        notifyBrowserLocationDisabled();
      }
    );
  };

  const handleCancel = () => {
    setShowPopup(false);
    localStorage.setItem('locationPermissionDenied', 'true');
  };

  const notifyBrowserLocationDisabled = () => {
    toast.error('Location services are disabled in your browser. Please enable location services in your browser settings to use location-based features.');
  };

  return (
    <>
      {showPopup && <LocationPopup onConfirm={handleConfirm} onCancel={handleCancel} />}
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
};

export default LocationPermission;