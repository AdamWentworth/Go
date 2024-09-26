// BackgroundSearch.jsx

import React, { useState, useEffect } from 'react';
import './BackgroundSearch.css';

const BackgroundSearch = ({ pokemon, onSelectBackground, selectedCostumeId }) => {
  const [selectedBackground, setSelectedBackground] = useState(null);

  useEffect(() => {
    if (pokemon && pokemon.backgrounds) {
      setSelectedBackground(null); // Default to "None" when component loads
    }
  }, [pokemon]);

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    onSelectBackground(background);
  };

  const isBackgroundSelectable = (background) => {
    if (!pokemon) return false;
    if (!background.costume_id) return true; // Background is selectable if no specific costume is required
    return background.costume_id === selectedCostumeId;
  };

  const selectableBackgrounds = pokemon ? pokemon.backgrounds.filter(isBackgroundSelectable) : [];

  return (
    <div className="background-search-component">
      <h3>Select Background</h3>
      <div className="background-list">
        <div
          className={`background-item selectable ${selectedBackground === null ? 'selected' : ''}`}
          onClick={() => handleBackgroundSelect(null)}
        >
          <div className="none-option">None</div>
        </div>
        {selectableBackgrounds.map((background) => (
          <div
            key={background.background_id}
            className={`background-item selectable ${selectedBackground === background ? 'selected' : ''}`}
            onClick={() => handleBackgroundSelect(background)}
          >
            <img src={background.image_url} alt={background.name} />
            <div className="background-info">
              <p>{background.location}</p>
              <p>{background.date}</p>
            </div>
          </div>
        ))}
      </div>
      {selectedBackground && (
        <div className="selected-background">
          <h4>Selected Background:</h4>
          <p>{selectedBackground.name}</p>
          <img src={selectedBackground.image_url} alt={selectedBackground.name} />
        </div>
      )}
    </div>
  );
};

export default BackgroundSearch;