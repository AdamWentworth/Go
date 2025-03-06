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

  // Ensure all empty strings are converted to null before rendering
  // Retain original 0 values
  const sanitizedIvs = Object.fromEntries(
    Object.entries(ivs).map(([key, value]) => {
      const sanitizedValue = value === '' ? null : value; // Convert empty strings to null
      return [key, sanitizedValue];
    })
  );

  const handleIvChange = (event, type) => {
    let value = event.target.value;
    if (value === '') {
      onIvChange({ ...sanitizedIvs, [type]: null }); // Convert empty input to null in state
    } else {
      value = parseInt(value, 10);
      const updatedIvs = {
        ...sanitizedIvs,
        [type]: isNaN(value) ? null : Math.max(0, Math.min(15, value)), // Clamp between 0 and 15 or null if invalid
      };
      onIvChange(updatedIvs);
    }
  };

  const handleKeyPress = (event, type) => {
    if (event.key === 'Enter') {;
      event.preventDefault();
      inputRefs[type].current.blur();
    }
  };

  const renderIvField = (type, label) => {
    return (
      <div className="iv-display" key={type}>
        <span className="iv-label">{label}:</span>
        <div className="iv-content">
          {editMode ? (
            <input
              type="number"
              ref={inputRefs[type]}
              value={sanitizedIvs[type] === null ? '' : sanitizedIvs[type]} // Show empty string for null in input
              onChange={(event) => handleIvChange(event, type)}
              onKeyPress={(event) => handleKeyPress(event, type)}
              min="0"
              max="15"
              className="iv-input"
              placeholder="—"
            />
          ) : (
            <span className="iv-value">
              {sanitizedIvs[type] === null || sanitizedIvs[type] === '' ? '—' : sanitizedIvs[type]} {/* Ensure null or empty string displays '—' */}
            </span>
          )}
        </div>
        <div className="iv-bar-bg"></div>
        <div
          className={`iv-bar ${sanitizedIvs[type] === 15 ? 'full' : ''}`}
          style={{ 
            width: sanitizedIvs[type] === null || sanitizedIvs[type] === '' ? '0%' : `${(sanitizedIvs[type] / 15) * 75}%` /* Ensure progress bar is empty for null or empty */
          }}
        ></div>
      </div>
    );
  };

  return (
    <div className="iv-container">
      {renderIvField('Attack', 'Attack')}
      {renderIvField('Defense', 'Defense')}
      {renderIvField('Stamina', 'HP')}
    </div>
  );
};

export default IVComponent;
