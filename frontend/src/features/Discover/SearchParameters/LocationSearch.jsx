// LocationSearch.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null); // Ref for the component wrapper

  const BASE_URL = process.env.REACT_APP_LOCATION_SERVICE_URL;

  const fetchSuggestions = async (userInput) => {
    try {
      const normalizedInput = userInput.normalize('NFD').replace(/[̀-\u036f]/g, '');
      const response = await axios.get(`${BASE_URL}/autocomplete?query=${encodeURIComponent(normalizedInput)}`, {
        withCredentials: false,
      });
      const data = response.data;

      const formattedSuggestions = data.slice(0, 5).map((item) => {
        const name = item.name || '';
        const state = item.state_or_province || '';
        const country = item.country || '';
        let displayName = `${name}`;
        if (state) displayName += `, ${state}`;
        if (country) displayName += `, ${country}`;
        return {
          displayName,
          ...item,
        };
      });

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleLocationChange = (e) => {
    const userInput = e.target.value;
    setCity(userInput);

    if (userInput.length > 2) {
      fetchSuggestions(userInput);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const formattedLocation = suggestion.displayName;
    setCity(formattedLocation);
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