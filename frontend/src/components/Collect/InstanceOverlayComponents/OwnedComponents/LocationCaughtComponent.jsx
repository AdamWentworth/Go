// LocationCaughtComponent.jsx
import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './LocationCaughtComponent.css';

const LocationCaughtComponent = ({ pokemon, editMode, onLocationChange }) => {
  const [location, setLocation] = useState(pokemon.ownershipStatus.location_caught);
  const [suggestions, setSuggestions] = useState([]);
  const locationRef = useRef(null);

  useEffect(() => {
    setLocation(pokemon.ownershipStatus.location_caught);
  }, [pokemon]);

  useEffect(() => {
    if (editMode && locationRef.current) {
      locationRef.current.textContent = location || '';
      setCaretToEnd(locationRef.current);
    }
  }, [editMode, location]);

  const fetchSuggestions = async (userInput) => {
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(userInput)}`, {
        withCredentials: false // Ensure credentials are not included in the request
      });
      const formattedSuggestions = response.data.features.slice(0, 4).map(feature => {
        const { name, state, country } = feature.properties;
        let displayName = `${name}`;
        if (state) displayName += `, ${state}`;
        displayName += `, ${country}`;
        return {
          ...feature,
          displayName
        };
      });
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleLocationInput = (event) => {
    const userInput = event.target.textContent;
    setLocation(userInput);
    onLocationChange(userInput);
    if (userInput.length > 2) {
      fetchSuggestions(userInput);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    const formattedLocation = suggestion.displayName;
    setLocation(formattedLocation);
    onLocationChange(formattedLocation);
    if (locationRef.current) {
      locationRef.current.textContent = formattedLocation;
      setCaretToEnd(locationRef.current);
    }
    setSuggestions([]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const setCaretToEnd = (element) => {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  useEffect(() => {
    if (editMode && suggestions.length > 0 && locationRef.current) {
      const { bottom, left, width } = locationRef.current.getBoundingClientRect();
      const suggestionsElement = document.querySelector('.suggestions');
      suggestionsElement.style.top = `${bottom + window.scrollY}px`;
      suggestionsElement.style.left = `${left}px`;
      suggestionsElement.style.width = `${width}px`;
    }
  }, [suggestions, editMode]);

  return (
    <div className="location-container">
      <div className="location-field">
        <label id="location-label">Location Caught:</label>
        <span aria-labelledby="location-label" contentEditable={editMode}
              ref={locationRef}
              onInput={handleLocationInput}
              onKeyDown={handleKeyDown}
              role="textbox"
              suppressContentEditableWarning={true}
              className={editMode ? 'editable' : 'text'}>
          {location}
        </span>
      </div>
      {editMode && suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((suggestion, index) => (
            <div key={index} onClick={() => selectSuggestion(suggestion)} className="suggestion-item">
              {suggestion.displayName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationCaughtComponent;
