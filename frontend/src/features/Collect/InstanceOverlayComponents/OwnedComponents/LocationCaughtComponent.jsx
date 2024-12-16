// LocationCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './LocationCaughtComponent.css';

const LocationCaughtComponent = ({ pokemon, editMode, onLocationChange }) => {
  const [location, setLocation] = useState(pokemon.ownershipStatus.location_caught);
  const [suggestions, setSuggestions] = useState([]);
  const locationRef = useRef(null);
  const wrapperRef = useRef(null); // Define wrapperRef

  const BASE_URL = process.env.REACT_APP_LOCATION_SERVICE_URL;

  useEffect(() => {
    setLocation(pokemon.ownershipStatus.location_caught);
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
      locationRef.current.textContent = location || '';
      setCaretToEnd(locationRef.current);
    }
  }, [editMode, location]);

  const fetchSuggestions = async (userInput) => {
    try {
      const normalizedInput = userInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const response = await axios.get(`${BASE_URL}/autocomplete?query=${encodeURIComponent(normalizedInput)}`, {
        withCredentials: false,
      });
      const data = response.data;
  
      // Guard against null or undefined data
      if (Array.isArray(data)) {
        const formattedSuggestions = data.slice(0, 5).map(item => {
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
        // console.log('Fetched suggestions:', formattedSuggestions); // Log the suggestions
      } else {
        if (process.env.REACT_APP_LOG_WARNINGS === 'true') {
          console.warn('Unexpected data format:', data); // Log if data is not as expected
        }
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]); // Silently handle the error by resetting suggestions
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

  return (
    <div className="location-caught-container" ref={wrapperRef}>
      {/* Attach wrapperRef here */}
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
