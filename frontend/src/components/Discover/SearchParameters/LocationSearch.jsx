import React from 'react';
import './LocationSearch.css';

const LocationSearch = ({ country, setCountry, city, setCity, useCurrentLocation, setUseCurrentLocation }) => {
  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    setCountry('');
    setCity('');
  };

  const handleDoNotUseLocation = () => {
    setUseCurrentLocation(false);
  };

  return (
    <div className="location-search">
      <h3>Location</h3>

      <div className="location-container">
        {/* Column 1: Text Fields */}
        <div className="location-fields">
          <div className="field">
            <label>Country:</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={useCurrentLocation}
              placeholder="Enter country"
            />
          </div>
          <div className="field">
            <label>City:</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={useCurrentLocation}
              placeholder="Enter city"
            />
          </div>
        </div>

        {/* Column 2: Buttons */}
        <div className="location-buttons">
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
