// LocationCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import { fetchSuggestions } from '../../../../services/locationServices';
import './LocationCaughtComponent.css';

const LocationCaughtComponent = ({ pokemon, editMode, onLocationChange }) => {
  const [location, setLocation] = useState(pokemon.ownershipStatus.location_caught || '');
  const [suggestions, setSuggestions] = useState([]);
  const locationRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setLocation(pokemon.ownershipStatus.location_caught || '');
  }, [pokemon]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (editMode && locationRef.current) {
      locationRef.current.textContent = location;
      setCaretToEnd(locationRef.current);
      locationRef.current.focus(); // Automatically focus when entering edit mode
    }
  }, [editMode, location]);

  const handleLocationInput = async (event) => {
    const userInput = event.target.textContent;
    setLocation(userInput);
    onLocationChange(userInput);

    if (userInput.length > 2) {
      try {
        const fetchedSuggestions = await fetchSuggestions(userInput); // Use the imported function
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
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
      locationRef.current.blur(); // Remove focus to stop editing
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

  // Conditional Rendering Logic
  if ((!location || location.trim() === '') && !editMode) {
    return null; // Do not render the component if location is null/empty and not in edit mode
  }

  return (
    <div className="location-caught-container" ref={wrapperRef}>
      <div className="location-field">
        <label id="location-label">Location Caught:</label>
        <span
          aria-labelledby="location-label"
          contentEditable={editMode}
          ref={locationRef}
          onInput={handleLocationInput}
          onKeyDown={handleKeyDown}
          role="textbox"
          suppressContentEditableWarning={true}
          className={editMode ? 'editable' : 'text'}
        >
          {location}
        </span>
        {editMode && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="suggestion-item"
              >
                {suggestion.displayName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCaughtComponent;
