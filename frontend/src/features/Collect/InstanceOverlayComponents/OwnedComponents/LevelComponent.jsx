// OwnedComponents/LevelComponent.jsx

import React from 'react';
import './LevelComponent.css';

const LevelComponent = ({ pokemon, editMode, level, onLevelChange, errors }) => {
  return (
    <div className="level-component">
      <label htmlFor={`level-${pokemon.pokemonKey}`}>Level:</label>
      {editMode ? (
        <input
          type="number"
          id={`level-${pokemon.pokemonKey}`}
          value={level !== null ? level : ''}
          onChange={(e) => onLevelChange(e.target.value)}
          min="1"
          max="51" // Assuming Pokémon levels range from 1 to 50
          className="level-input"
          placeholder="1-51"
        />
      ) : (
        <span>{level !== null ? level : 'N/A'}</span>
      )}
    </div>
  );
};

export default LevelComponent;
