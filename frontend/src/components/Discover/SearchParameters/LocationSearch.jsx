// LocationSearch.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LocationSearch.css';

const breakpoints = [1, 2, 3, 4, 5, 10, 15, 20, 25];
const resultsLimits = [5, 25, 50, 100]; // Define available results limits

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
  setView        
}) => {
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const inputRef = useRef(null);

  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`, {
        withCredentials: false
      });
      const suggestions = response.data.features.map((feature) => {
        const { name, state, country } = feature.properties;
        let displayName = `${name}`;
        if (state) displayName += `, ${state}`;
        displayName += `, ${country}`;
        return { name, country, displayName };
      });

      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setCity(newLocation);
    if (newLocation.length > 2) {
      fetchSuggestions(newLocation);
    } else {
      setLocationSuggestions([]);
    }
  };

  const selectLocation = (suggestion) => {
    setCity(suggestion.displayName);
    setLocationSuggestions([]);
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

  const handleRangeChange = (e) => {
    const newValue = parseFloat(e.target.value);
    const closest = breakpoints.reduce((prev, curr) => (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev));
    setRange(closest);
  };

  const handleResultsLimitChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    const closest = resultsLimits.reduce((prev, curr) => (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev));
    setResultsLimit(closest);
  };

  return (
    <div className="location-search">
      <h3 className="location-header">Location</h3>

      <div className="location-container">
        {/* Column 1: Toggle Button Centered */}
        <div className="location-button-centered">
          <button onClick={toggleUseCurrentLocation}>
            {useCurrentLocation ? 'Disable Current Location' : 'Use Current Location'}
          </button>
        </div>

        {/* Column 2: Location Field */}
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
            {locationSuggestions.length > 0 && (
              <div className="suggestions" style={{ position: 'absolute', top: `${inputRef.current?.offsetHeight || 40}px` }}>
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectLocation(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sliders Row: Range and Results Limit */}
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

      {/* Search Button Row */}
      <div className="location-search-button">
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* View Toggle Buttons */}
      <div className="view-toggle-buttons">
        <button onClick={() => setView('list')}>List View</button>
        <button onClick={() => setView('globe')}>Globe View</button>
      </div>
    </div>
  );
};

export default LocationSearch;