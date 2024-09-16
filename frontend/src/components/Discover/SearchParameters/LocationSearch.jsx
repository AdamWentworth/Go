import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LocationSearch.css';

const breakpoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const LocationSearch = ({ country, setCountry, city, setCity, useCurrentLocation, setUseCurrentLocation }) => {
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [range, setRange] = useState(5); // Default range value

  // Fetch location suggestions based on user input
  const fetchSuggestions = async (query, type) => {
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`, {
        withCredentials: false // Ensure credentials are not included in the request
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

  // Handle city input change
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setCity(newCity);
    if (newCity.length > 2) {
      fetchSuggestions(newCity, 'city');
    } else {
      setCitySuggestions([]);
    }
  };

  // Handle country input change
  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    if (newCountry.length > 2) {
      fetchSuggestions(newCountry, 'country');
    } else {
      setCountrySuggestions([]);
    }
  };

  // Handle selection of city suggestion and auto-fill country
  const selectCity = (suggestion) => {
    setCity(suggestion.name);
    if (!country) {
      setCountry(suggestion.country); // Auto-fill country if city is selected
    }
    setCitySuggestions([]);
  };

  // Handle selection of country suggestion
  const selectCountry = (suggestion) => {
    setCountry(suggestion.name);
    setCountrySuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    setCountry('');
    setCity('');
  };

  const handleDoNotUseLocation = () => {
    setUseCurrentLocation(false);
  };

  // Handle range change with snapping behavior
  const handleRangeChange = (e) => {
    const newValue = parseFloat(e.target.value);
    const closest = breakpoints.reduce((prev, curr) => (Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev));
    setRange(closest);
  };

  return (
    <div className="location-search">
      <h3>Location</h3>

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
            {/* City suggestions */}
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
            {/* Country suggestions */}
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

        {/* Column 2: Range and Buttons */}
        <div className="location-buttons">
          <div className="field">
            <label>Range (km): {range}</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={range}
              onChange={handleRangeChange}
            />
          </div>
          <button onClick={handleUseCurrentLocation} disabled={useCurrentLocation}>
            Use my current location
          </button>
          <button onClick={handleDoNotUseLocation} disabled={!useCurrentLocation}>
            Do not use my current location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearch;
