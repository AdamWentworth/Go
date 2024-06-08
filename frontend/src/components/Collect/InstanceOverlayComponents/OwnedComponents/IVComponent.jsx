// IVComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './IVComponent.css';

const IVComponent = ({ pokemon, editMode }) => {
  const [ivs, setIvs] = useState({
    Attack: pokemon.ownershipStatus.attack_iv ?? 0,
    Defense: pokemon.ownershipStatus.defense_iv ?? 0,
    HP: pokemon.ownershipStatus.hp_iv ?? 0
  });
  const inputRefs = {
    Attack: useRef(null),
    Defense: useRef(null),
    HP: useRef(null),
  };

  useEffect(() => {
    if (editMode) {
      Object.keys(inputRefs).forEach(type => {
        if (inputRefs[type].current) {
          inputRefs[type].current.select();
        }
      });
    }
  }, [editMode]);

  const handleIvChange = (event, type) => {
    let value = event.target.value;
    if (value === '') {
      setIvs({ ...ivs, [type]: '' });
    } else {
      value = parseInt(value, 10);
      setIvs({ ...ivs, [type]: isNaN(value) ? 0 : Math.max(0, Math.min(15, value)) });
    }
  };

  const handleKeyPress = (event, type) => {
    if (event.key === 'Enter') {
      saveValue(type);
    }
  };

  const saveValue = (type) => {
    const value = ivs[type] === '' ? 0 : ivs[type];
    setIvs({ ...ivs, [type]: value });
  };

  const renderIvField = (type) => (
    <div className="iv-display" key={type}>
      <span className="iv-label">{type}:</span>
      <div></div>
      <span className="iv-value">
        {editMode ? (
          <input
            type="number"
            ref={inputRefs[type]}
            value={ivs[type]}
            onChange={(event) => handleIvChange(event, type)}
            onKeyPress={(event) => handleKeyPress(event, type)}
            autoFocus
            min="0"
            max="15"
            className="iv-input"
          />
        ) : (
          ivs[type]
        )}
      </span>
      <div className="iv-bar-bg"></div>
      <div className={`iv-bar ${ivs[type] === 15 ? 'full' : ''}`} style={{width: `${(ivs[type] / 15) * 75}%`}}></div>
    </div>
  );

  return (
    <div className="iv-container">
      {renderIvField('Attack')}
      {renderIvField('Defense')}
      {renderIvField('HP')}
    </div>
  );
};

export default IVComponent;