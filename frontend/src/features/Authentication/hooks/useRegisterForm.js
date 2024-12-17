// useRegisterForm.js

import { useState } from 'react';
import { fetchSuggestions } from '../../../services/locationSuggestions';

const useRegisterForm = () => {
  const [values, setValues] = useState({
    username: '',
    email: '',
    password: '',
    trainerCode: '',
    pokemonGoName: '',
    coordinates: null,
    allowLocation: false,
    pokemonGoNameDisabled: false,
    locationInput: '',
  });
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = async (event) => {
    const { name, value } = event.target;
    if (name === 'locationInput') {
      setSelectedCoordinates(null);
      setValues((prev) => ({ ...prev, coordinates: null }));
      if (value.length > 2) {
        const fetchedSuggestions = await fetchSuggestions(value);
        setSuggestions(fetchedSuggestions);
      } else {
        setSuggestions([]);
      }
    }
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAllowLocationChange = (e) => {
    const allowLocation = e.target.checked;
    setValues((prev) => ({
      ...prev,
      allowLocation,
      coordinates: allowLocation ? null : prev.coordinates,
    }));
    if (allowLocation) setSelectedCoordinates(null);
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
  };
};

export default useRegisterForm;
