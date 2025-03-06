// LocationOptionsOverlay.jsx

import React from 'react';
import './LocationOptionsOverlay.css';

const LocationOptionsOverlay = ({ locations, onLocationSelect, onDismiss }) => {
  return (
    <div className="location-options-overlay">
      <h4>Select a location:</h4>
      <button className="dismiss-options-button" onClick={onDismiss}>
        Dismiss Options
      </button>
      <ul>
        {locations.map((location, index) => (
          <li key={index}>
            <button
              className="location-button"
              onClick={() => onLocationSelect(location)}
            >
              {location.name || 'Unnamed Location'}
              {location.state_or_province ? `, ${location.state_or_province}` : ''}
              {location.country ? `, ${location.country}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationOptionsOverlay;
