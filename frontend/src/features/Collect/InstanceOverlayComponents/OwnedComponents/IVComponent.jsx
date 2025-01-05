// OwnedComponents/IVComponent.jsx

import React, { useRef, useEffect } from 'react';
import './IVComponent.css';

const IVComponent = ({ pokemon, editMode, ivs, onIvChange, errors }) => {
  const inputRefs = {
    Attack: useRef(null),
    Defense: useRef(null),
    Stamina: useRef(null),
  };

  useEffect(() => {
    if (editMode) {
      Object.keys(inputRefs).forEach((type) => {
        if (inputRefs[type].current) {
          inputRefs[type].current.focus();
          inputRefs[type].current.select();
        }
      });
    }
  }, [editMode]);

  const handleIvChange = (event, type) => {
    let value = event.target.value;
    if (value === '') {
      onIvChange({ ...ivs, [type]: '' }); // Allow empty input
    } else {
      value = parseInt(value, 10);
      const updatedIvs = {
        ...ivs,
        [type]: isNaN(value) ? '' : Math.max(0, Math.min(15, value)), // Clamp between 0 and 15
      };
      onIvChange(updatedIvs);
    }
  };

  const handleKeyPress = (event, type) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission or line breaks
      inputRefs[type].current.blur(); // Remove focus from the input
    }
  };

  const renderIvField = (type, label) => (
    <div className="iv-display" key={type}>
      <span className="iv-label">{label}:</span>
      <div className="iv-content">
        {editMode ? (
          <input
            type="number"
            ref={inputRefs[type]}
            value={ivs[type]}
            onChange={(event) => handleIvChange(event, type)}
            onKeyPress={(event) => handleKeyPress(event, type)}
            min="0"
            max="15"
            className="iv-input"
          />
        ) : (
          <span className="iv-value">{ivs[type] !== '' ? ivs[type] : '—'}</span> // Display '—' for missing IVs
        )}
      </div>
      <div className="iv-bar-bg"></div>
      <div
        className={`iv-bar ${ivs[type] === 15 ? 'full' : ''}`}
        style={{ width: ivs[type] !== '' ? `${(ivs[type] / 15) * 75}%` : '0%' }}
      ></div>
    </div>
  );

  return (
    <div className="iv-container">
      {renderIvField('Attack', 'Attack')}
      {renderIvField('Defense', 'Defense')}
      {renderIvField('Stamina', 'HP')}
    </div>
  );
};

export default IVComponent;
