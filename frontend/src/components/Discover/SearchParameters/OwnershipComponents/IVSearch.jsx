// IVSearch.jsx
import React, { useState, useEffect } from 'react';
import './IVSearch.css';

const IVSearch = ({ stats, onStatChange = () => {} }) => {
  const [localStats, setLocalStats] = useState({
    Attack: stats.attack !== undefined ? stats.attack : '',
    Defense: stats.defense !== undefined ? stats.defense : '',
    Stamina: stats.stamina !== undefined ? stats.stamina : '',
  });

  const [isHundo, setIsHundo] = useState(false);

  useEffect(() => {
    // Initialize local stats based on props
    setLocalStats({
      Attack: stats.attack !== undefined ? stats.attack : '',
      Defense: stats.defense !== undefined ? stats.defense : '',
      Stamina: stats.stamina !== undefined ? stats.stamina : '',
    });
  }, [stats.attack, stats.defense, stats.stamina]);

  useEffect(() => {
    if (isHundo) {
      // If Hundo is checked, set all stats to 15
      const hundoStats = {
        Attack: 15,
        Defense: 15,
        Stamina: 15,
      };
      setLocalStats(hundoStats);
      onStatChange(hundoStats);
    }
    // If Hundo is unchecked, stats should remain as is (no changes)
  }, [isHundo, onStatChange]);

  const handleStatChange = (event, type) => {
    let value = event.target.value;
    if (value === '') {
      setLocalStats({ ...localStats, [type]: '' });
      onStatChange({ ...localStats, [type]: null });
    } else {
      value = parseInt(value, 10);
      const updatedStats = { ...localStats, [type]: isNaN(value) ? '' : Math.max(0, Math.min(15, value)) };
      setLocalStats(updatedStats);
      onStatChange(updatedStats);
    }
  };

  const renderStatField = (type, label) => (
    <div className="stat-display" key={type}>
      <span className="stat-label">{label}:</span>
      <div className="stat-content">
        <input
          type="number"
          value={localStats[type]}
          onChange={(event) => handleStatChange(event, type)}
          min="0"
          max="15"
          className="stat-input"
          placeholder=""
          disabled={isHundo} // Disable input if Hundo is checked
        />
      </div>
      <div className="stat-bar-bg"></div>
      {localStats[type] !== '' && (
        <div
          className={`stat-bar ${localStats[type] === 15 ? 'full' : ''}`}
          style={{ width: `${(localStats[type] / 15) * 75}%` }}
        ></div>
      )}
    </div>
  );

  return (
    <div className="stat-container">
      {renderStatField('Attack', 'Attack')}
      {renderStatField('Defense', 'Defense')}
      {renderStatField('Stamina', 'HP')}
    </div>
  );
};

export default IVSearch;