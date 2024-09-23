// LocationSearch.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LocationSearch.css';

const breakpoints = [1, 2, 3, 4, 5, 10, 15, 20, 25];

const LocationSearch = ({
  country,
  setCountry,
  city,
  setCity,
  useCurrentLocation,
  setUseCurrentLocation,
  setCoordinates,
  range,
  setRange,
  handleSearch,  // New prop for handling the search
  isLoading,     // New prop for loading state
  view,          // New prop for view state
  setView        // New prop for view state setter
}) => {
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);

  const fetchSuggestions = async (query, type) => {
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

      if (type === 'country') {
        setCountrySuggestions(suggestions);
      } else if (type === 'city') {
        setCitySuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setCity(newCity);
    if (newCity.length > 2) {
      fetchSuggestions(newCity, 'city');
    } else {
      setCitySuggestions([]);
    }
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    if (newCountry.length > 2) {
      fetchSuggestions(newCountry, 'country');
    } else {
      setCountrySuggestions([]);
    }
  };

  const selectCity = (suggestion) => {
    setCity(suggestion.name);
    if (!country) {
      setCountry(suggestion.country);
    }
    setCitySuggestions([]);
  };

  const selectCountry = (suggestion) => {
    setCountry(suggestion.name);
    setCountrySuggestions([]);
  };

  const toggleUseCurrentLocation = () => {
    const newUseCurrentLocation = !useCurrentLocation;
    setUseCurrentLocation(newUseCurrentLocation);

    if (newUseCurrentLocation) {
      setCountry('');
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

  return (
    <div className="location-search">
      <h3 className="location-header">Location</h3>

      <div className="location-container">
        {/* Column 1: Text Fields */}
        <div className="location-fields">
          <div className="field">
            <label>City:</label>
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              disabled={useCurrentLocation}
              placeholder="Enter city"
            />
            {citySuggestions.length > 0 && (
              <div className="suggestions">
                {citySuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectCity(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="field">
            <label>Country:</label>
            <input
              type="text"
              value={country}
              onChange={handleCountryChange}
              disabled={useCurrentLocation}
              placeholder="Enter country"
            />
            {countrySuggestions.length > 0 && (
              <div className="suggestions">
                {countrySuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => selectCountry(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Range and Toggle Button */}
        <div className="location-buttons">
          <div className="field">
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
          <button onClick={toggleUseCurrentLocation}>
            {useCurrentLocation ? 'Disable Current Location' : 'Use Current Location'}
          </button>
        </div>
      </div>

      {/* Search Button */}
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