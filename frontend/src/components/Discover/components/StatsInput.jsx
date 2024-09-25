// StatsInput.jsx
import React, { useState, useEffect } from 'react';
import './StatsInput.css';

const StatsInput = ({ stats, onStatChange = () => {} }) => {
  const [localStats, setLocalStats] = useState({
    Attack: stats.attack !== undefined ? stats.attack : '',
    Defense: stats.defense !== undefined ? stats.defense : '',
    Stamina: stats.stamina !== undefined ? stats.stamina : '',
  });

  useEffect(() => {
    setLocalStats({
      Attack: stats.attack !== undefined ? stats.attack : '',
      Defense: stats.defense !== undefined ? stats.defense : '',
      Stamina: stats.stamina !== undefined ? stats.stamina : '',
    });
  }, [stats.attack, stats.defense, stats.stamina]);

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

export default StatsInput;