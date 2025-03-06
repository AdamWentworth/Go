// LocationSearch.jsx

import React, { useState, useEffect, useRef } from 'react';
import { fetchSuggestions } from '../../../services/locationServices'; // Import the service
import './LocationSearch.css';

const LocationSearch = ({
  city,
  setCity,
  useCurrentLocation,
  setUseCurrentLocation,
  setCoordinates,
  range,
  setRange,
  resultsLimit,
  setResultsLimit,
  handleSearch,
  isLoading,
  view,
  setView,
  setSelectedBoundary
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null); // Ref for the component wrapper

  const handleLocationChange = async (e) => {
    const userInput = e.target.value;
    setCity(userInput);

    if (userInput.length > 2) {
      const fetchedSuggestions = await fetchSuggestions(userInput); // Use the imported function
      setSuggestions(fetchedSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const formattedLocation = suggestion.displayName;
    setCity(formattedLocation);
  
    // Set coordinates if available
    if (suggestion.latitude && suggestion.longitude) {
      setCoordinates({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    } else {
      setCoordinates({ latitude: null, longitude: null });
    }
  
    // Only update the boundary if setSelectedBoundary is a function
    if (typeof setSelectedBoundary === 'function') {
      setSelectedBoundary(suggestion.boundary);
    }
  
    setSuggestions([]);
  };  

  const toggleUseCurrentLocation = () => {
    const newUseCurrentLocation = !useCurrentLocation;
    setUseCurrentLocation(newUseCurrentLocation);

    if (newUseCurrentLocation) {
      setCity('');
      const storedLocation = localStorage.getItem('location');
      if (storedLocation) {
        const { latitude, longitude } = JSON.parse(storedLocation);
        setCoordinates({ latitude, longitude });
        console.log(`Using current location: Latitude ${latitude}, Longitude ${longitude}`);
      } else {
        console.error('No location found in localStorage.');
      }
    } else {
      setCoordinates({ latitude: null, longitude: null });
    }
  };

  const handleClickOutside = (event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRangeChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setRange(newValue);
  };

  const handleResultsLimitChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setResultsLimit(newValue);
  };

  return (
    <div className="location-search" ref={wrapperRef}>
      <h3 className="location-header">Location</h3>

      <div className="location-container">
        <div className="location-button-centered">
          <button onClick={toggleUseCurrentLocation}>
            {useCurrentLocation ? 'Disable Current Location' : 'Use Current Location'}
          </button>
        </div>

        <div className="location-field">
          <div className="location-input">
            <input
              ref={inputRef}
              type="text"
              value={city}
              onChange={handleLocationChange}
              disabled={useCurrentLocation}
              placeholder="Enter location"
            />
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sliders-container">
        <div className="range-field">
          <label>Range (km): {range}</label>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={range}
            onChange={handleRangeChange}
          />
        </div>

        <div className="results-limit">
          <label>Results Limit: {resultsLimit}</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={resultsLimit}
            onChange={handleResultsLimitChange}
          />
        </div>
      </div>

      <div className="location-search-button">
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
};

export default LocationSearch;
