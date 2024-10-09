// IVDisplay.jsx

import React from 'react';
import './IVDisplay.css';

const IVDisplay = ({ item }) => {
  // Extract the IV stats from the item
  const stats = {
    attack: item.attack_iv,
    defense: item.defense_iv,
    stamina: item.stamina_iv,
  };

  const renderStatField = (type, label) => (
    <div className="iv-display-stat" key={type}>
      <span className="iv-display-label">{label}:</span>
      <div className="iv-display-content">
        <span className="iv-display-value">{stats[type] !== undefined && stats[type] !== null ? stats[type] : ''}</span>
      </div>
      <div className="iv-display-bar-bg"></div>
      {stats[type] !== undefined && stats[type] !== null && (
        <div
          className={`iv-display-bar ${stats[type] === 15 ? 'iv-display-full' : ''}`}
          style={{ width: `${(stats[type] / 15) * 75}%` }}
        ></div>
      )}
    </div>
  );

  return (
    <div className="iv-display-container">
      {renderStatField('attack', 'Attack')}
      {renderStatField('defense', 'Defense')}
      {renderStatField('stamina', 'HP')}
    </div>
  );
};

export default IVDisplay;