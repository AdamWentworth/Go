// BackgroundLocationCard.jsx

import React, { useState, useEffect } from 'react';
import './BackgroundLocationCard.css';

const BackgroundLocationCard = ({
  pokemon,
  onSelectBackground,
  selectedCostumeId,         // Optional: used when filtering by costume
  filterBackground,          // Optional: override the default filtering logic
  title = 'Select Background',
  containerClassName = 'background-location-card',
  itemClassName = 'background-item',
  selectedItemClassName = 'selected'
}) => {
  const [selectedBackground, setSelectedBackground] = useState(null);

  // Reset selection when the pokemon prop changes
  useEffect(() => {
    setSelectedBackground(null);
  }, [pokemon]);

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    if (onSelectBackground) {
      onSelectBackground(background);
    }
  };

  // Default filtering:
  // If a selectedCostumeId is provided, use that;
  // Otherwise, if pokemon.variantType exists, use it to filter.
  const defaultFilter = (background) => {
    if (!pokemon || !background) return false;
    if (selectedCostumeId !== undefined && selectedCostumeId !== null) {
      if (!background.costume_id) return true;
      return background.costume_id === selectedCostumeId;
    } else if (pokemon.variantType) {
      const variantTypeId = pokemon.variantType.split('_')[1];
      if (!background.costume_id) return true;
      return background.costume_id === parseInt(variantTypeId, 10);
    }
    return true;
  };

  const isSelectable = filterBackground ? filterBackground : defaultFilter;
  const selectableBackgrounds =
    pokemon && pokemon.backgrounds
      ? pokemon.backgrounds.filter(isSelectable)
      : [];

  return (
    <div className={containerClassName}>
      <h3>{title}</h3>
      <div className="background-list">
        <div
          className={`${itemClassName} ${selectedBackground === null ? selectedItemClassName : ''}`}
          onClick={() => handleBackgroundSelect(null)}
        >
          <div className="none-option">None</div>
        </div>
        {selectableBackgrounds.map((background) => (
          <div
            key={background.background_id}
            className={`${itemClassName} ${selectedBackground === background ? selectedItemClassName : ''}`}
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

export default BackgroundLocationCard;
