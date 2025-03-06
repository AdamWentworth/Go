// BackgroundComponent.jsx
import React, { useState } from 'react';
import './BackgroundComponent.css';

const BackgroundComponent = ({ pokemon, onSelectBackground }) => {
  const [selectedBackground, setSelectedBackground] = useState(null);

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    onSelectBackground(background);
  };

  const isBackgroundSelectable = (background) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter(isBackgroundSelectable);

  return (
    <div className="background-component">
      <h3>Select Background</h3>
      <div className="background-list">
        <div
          className="background-item selectable"
          onClick={() => handleBackgroundSelect(null)}
        >
          <div className="none-option">None</div>
        </div>
        {selectableBackgrounds.map((background) => (
          <div
            key={background.background_id}
            className="background-item selectable"
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

export default BackgroundComponent;
