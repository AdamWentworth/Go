// OwnedComponents/LevelComponent.jsx

import React from 'react';
import './LevelComponent.css';

const LevelComponent = ({ pokemon, editMode, level, onLevelChange, errors }) => {
  return (
    <div className="level-component">
      {editMode || level !== null ? (
        <div className="level-inline">
          <span className="level-label">Level:</span>
          {editMode ? (
            <input
              type="number"
              value={level !== null ? level : ''}
              onChange={(e) => onLevelChange(e.target.value)}
              min="1"
              max="51"
              className="level-input"
              placeholder="1-51"
            />
          ) : (
            <span className="level-value">{level !== null ? level : 'N/A'}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default LevelComponent;
