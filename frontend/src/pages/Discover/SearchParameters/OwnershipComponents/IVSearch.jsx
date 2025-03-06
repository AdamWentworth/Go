// IVSearch.jsx
import React from 'react';
import './IVSearch.css';

const IVSearch = ({ stats = {}, onStatChange = () => {}, isHundo }) => {
  const handleStatChange = (event, type) => {
    const value =
      event.target.value === ''
        ? ''
        : Math.max(0, Math.min(15, parseInt(event.target.value, 10)));
    onStatChange(type, value);
  };

  const renderStatField = (type, label) => (
    <div className="stat-display" key={type}>
      <span className="stat-label">{label}:</span>
      <div className="stat-content">
        <input
          type="number"
          value={stats[type] !== undefined && stats[type] !== null ? stats[type] : ''}
          onChange={(event) => handleStatChange(event, type)}
          min="0"
          max="15"
          className="stat-input"
          placeholder=""
          disabled={isHundo} // Disable input when Hundo is on
        />
      </div>
      <div className="stat-bar-bg"></div>
      {stats[type] !== '' && stats[type] !== null && (
        <div
          className={`stat-bar ${stats[type] === 15 ? 'full' : ''}`}
          style={{ width: `${(stats[type] / 15) * 75}%` }}
        ></div>
      )}
    </div>
  );

  return (
    <div className="stat-container">
      {renderStatField('attack', 'Attack')}
      {renderStatField('defense', 'Defense')}
      {renderStatField('stamina', 'HP')}
    </div>
  );
};

export default IVSearch;