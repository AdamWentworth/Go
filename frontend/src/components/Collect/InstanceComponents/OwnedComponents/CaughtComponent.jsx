// CaughtComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './CaughtComponent.css';

const CaughtComponent = ({ pokemon }) => {
  const editIcon = process.env.PUBLIC_URL + '/images/edit-icon.png';
  const saveIcon = process.env.PUBLIC_URL + '/images/save-icon.png';

  const [location, setLocation] = useState(pokemon.ownershipStatus.location_caught);
  const [suggestions, setSuggestions] = useState([]);
  const [date, setDate] = useState(pokemon.ownershipStatus.date_caught);
  const [editMode, setEditMode] = useState(false);
  const locationRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (editMode) {
      if (locationRef.current) {
        locationRef.current.textContent = location || '';
      }
      if (dateRef.current) {
        dateRef.current.textContent = date || '';
      }
    }
  }, [editMode]);

  const fetchSuggestions = async (userInput) => {
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(userInput)}`);
      console.log("Fetched suggestions:", response.data.features); // Verify what is fetched
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
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleLocationInput = (event) => {
    const userInput = event.target.textContent;
    setLocation(userInput);
    if (userInput.length > 2) {
      fetchSuggestions(userInput);
    } else {
      setSuggestions([]);
    }
    // We will set the caret position manually to ensure it stays in the correct place
    setTimeout(() => {
      setCaretToEnd(locationRef.current);
    }, 0);
  };

  const selectSuggestion = (suggestion) => {
    const formattedLocation = suggestion.displayName; // Includes name, state (if available), and country.
    setLocation(formattedLocation);  // Set state
    if (locationRef.current) {
      locationRef.current.textContent = formattedLocation;  // Update text in the editable span
      setCaretToEnd(locationRef.current);  // Position cursor at the end of the text
    }
    setSuggestions([]);  // Clear suggestions after selection
  };  

  const handleDateInput = (event) => {
    const userInput = event.target.textContent;
    setDate(userInput);
    setCaretToEnd(event.target);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveChanges();
    }
  };

  const setCaretToEnd = (target) => {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    target.focus();
  };

  const saveChanges = () => {
    setEditMode(false);
    if (locationRef.current) {
      locationRef.current.blur();
    }
    if (dateRef.current) {
      dateRef.current.blur();
    }
  };

  const toggleEdit = () => {
    setEditMode(!editMode);
  };

  return (
    <div className="caught-container">
      <div className="caught-field">
        <label htmlFor="location">Location Caught:</label>
        <span contentEditable={editMode} ref={locationRef} onInput={handleLocationInput} onKeyDown={handleKeyDown} suppressContentEditableWarning={true} className={editMode ? 'editable' : 'text'}>
          {location}
        </span>
        {editMode && suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => selectSuggestion(suggestion)}>
                {suggestion.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="caught-field">
        <label htmlFor="date">Date Caught:</label>
        <span contentEditable={editMode} ref={dateRef} onInput={handleDateInput} onKeyDown={handleKeyDown} suppressContentEditableWarning={true} className={editMode ? 'editable' : 'text'}>
          {date}
        </span>
      </div>
      <button onClick={toggleEdit} className="icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );  
};

export default CaughtComponent;
