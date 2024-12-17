// useRegisterForm.js

import { useState } from 'react';
import { fetchSuggestions } from '../../../services/locationSuggestions';
import { fetchLocationOptions } from '../services/locationService';

const useRegisterForm = () => {
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
        trainerCode: '',
        pokemonGoName: '',
        locationInput: '',
        coordinates: null,
        allowLocation: false,
        pokemonGoNameDisabled: false,
    });      
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showOptionsOverlay, setShowOptionsOverlay] = useState(false); // New state for overlay visibility
  const [locationOptions, setLocationOptions] = useState([]); // State to hold location options

  const handleInputChange = async (event) => {
    const { name, value } = event.target;
  
    if (name === 'locationInput') {
      // Show the warning when the location input is modified
      setShowLocationWarning(true);
  
      // Clear selected coordinates and uncheck the "allowLocation" checkbox
      setSelectedCoordinates(null);
      setValues((prev) => ({
        ...prev,
        coordinates: null,
        allowLocation: false, // Uncheck the allowLocation checkbox
        locationInput: value, // Update the location input value
      }));
  
      // Fetch location suggestions if the input value length > 2
      if (value.length > 2) {
        const fetchedSuggestions = await fetchSuggestions(value);
        setSuggestions(fetchedSuggestions);
      } else {
        setSuggestions([]); // Clear suggestions if input is too short
      }
    } else {
      // Handle other input fields normally
      setValues((prev) => ({ ...prev, [name]: value }));
    }
  };  

  const handleAllowLocationChange = async (e) => {
    const allowLocation = e.target.checked;
  
    setValues((prev) => ({
      ...prev,
      allowLocation,
      coordinates: allowLocation ? null : prev.coordinates,
    }));
  
    if (allowLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
  
            setSelectedCoordinates({ latitude, longitude });
            setValues((prev) => ({
              ...prev,
              coordinates: { latitude, longitude },
            }));
  
            try {
              const fetchedOptions = await fetchLocationOptions(latitude, longitude);
              setLocationOptions(fetchedOptions);
              setShowOptionsOverlay(true);
            } catch (error) {
              alert('Unable to fetch location options. Please try again.');
            }
          },
          (error) => {
            console.error('Error fetching location:', error.message);
            alert('Unable to fetch your current location. Please enable location permissions.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    } else {
      setSuggestions([]);
      setSelectedCoordinates(null);
      setShowOptionsOverlay(false);
      setLocationOptions([]);
    }
  };

  const handleOverlayLocationSelect = (location) => {
    // Update location input with the selected location
    const { name, city, state_or_province, country } = location;
    const locationParts = [name || city, state_or_province, country].filter(Boolean);
    const formattedLocation = locationParts.join(', ');
  
    setValues((prev) => ({
      ...prev,
      locationInput: formattedLocation,
    }));
  
    setShowOptionsOverlay(false);
    setLocationOptions([]);
  };

  const handleCoordinatesSelect = (coordinates) => {
    setSelectedCoordinates(coordinates);
    setValues((prev) => ({ ...prev, coordinates }));
  };

  const handleCheckboxChange = ({ target: { name, checked } }) => {
    setValues((prev) => ({ ...prev, [name]: checked }));
  };

  const handleLocationInputFocus = () => {
    if (selectedCoordinates) setShowLocationWarning(true);
  };

  const handleLocationInputBlur = () => setShowLocationWarning(false);

  const selectSuggestion = (suggestion) => {
    const { name, city, state_or_province, country } = suggestion;
  
    // Format the location input
    const locationParts = [
      name || city, 
      state_or_province, 
      country
    ].filter(Boolean); // Remove undefined/null values
  
    const formattedLocation = locationParts.join(', ');
  
    setValues((prev) => ({ ...prev, locationInput: formattedLocation }));
    setSuggestions([]); // Clear suggestions
  };  

  const handleLocationUpdate = (location) => {
    const { name, city, state_or_province, country } = location;
  
    const locationParts = [
      name || city, 
      state_or_province, 
      country
    ].filter(Boolean);
  
    const formattedLocation = locationParts.join(', ');
  
    setValues((prev) => ({
      ...prev,
      locationInput: formattedLocation,
    }));
  };
  

  return {
    values,
    isMapVisible,
    setIsMapVisible,
    selectedCoordinates,
    showLocationWarning,
    suggestions,
    handleInputChange,
    handleAllowLocationChange,
    handleCoordinatesSelect,
    handleCheckboxChange,
    handleLocationInputFocus,
    handleLocationInputBlur,
    selectSuggestion,
    handleLocationUpdate,
    showOptionsOverlay,        
    setShowOptionsOverlay,    
    locationOptions,           
    handleOverlayLocationSelect, 
  };
  
};

export default useRegisterForm;
