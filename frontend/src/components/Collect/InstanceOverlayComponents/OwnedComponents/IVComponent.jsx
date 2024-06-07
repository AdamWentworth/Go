// IVComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './IVComponent.css';

const IVComponent = ({ pokemon }) => {
  const [editMode, setEditMode] = useState({ Attack: false, Defense: false, HP: false });
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
    Object.keys(editMode).forEach(type => {
      if (editMode[type] && inputRefs[type].current) {
        inputRefs[type].current.select();
      }
    });
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
    setEditMode(prev => ({ ...prev, [type]: false }));
  };

  const renderIvField = (type) => (
    <div className="iv-display" key={type}>
      <span className="iv-label">{type}:</span>
      <span className="iv-value">
        {editMode[type] ? (
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
      <img src={editMode[type] ? "/images/save-icon.png" : "/images/edit-icon.png"} alt="Edit" className="edit-icon" onClick={() => editMode[type] ? saveValue(type) : setEditMode(prev => ({ ...prev, [type]: true }))} />
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