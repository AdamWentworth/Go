// IV.jsx

import React, { useRef, useEffect } from 'react';
import './IV.css';

const IV = ({
  // READ-ONLY ITEM MODE
  item,

  // EDIT MODE (OwnedInstance style)
  editMode = false,
  ivs = { Attack: '', Defense: '', Stamina: '' },
  onIvChange = () => {},

  // SEARCH MODE
  mode, // "search", "edit", etc.
  stats = { attack: '', defense: '', stamina: '' },
  onChange = () => {},
  isHundo = false,
  setIsHundo = () => {},
}) => {
  // Helper functions
  const clampValue = (val) => {
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(15, n));
  };

  const getBarWidth = (val) => (clampValue(val) / 15) * 75;

  // CASE 1: Read-only mode (IVDisplay)
  if (item) {
    const localStats = {
      attack: item.attack_iv,
      defense: item.defense_iv,
      stamina: item.stamina_iv,
    };

    const allNull =
      localStats.attack == null &&
      localStats.defense == null &&
      localStats.stamina == null;
    if (allNull) return null;

    const renderRow = (statKey, label) => {
      const val = localStats[statKey];
      const clamped = clampValue(val);
      const barWidth = getBarWidth(val);

      return (
        <div className="iv-display-stat" key={statKey}>
          <span className="iv-display-label">{label}:</span>
          <div className="iv-display-content">
            <span className="iv-display-value">{val != null ? val : ''}</span>
          </div>
          <div className="iv-display-bar-bg" />
          {val != null && (
            <div
              className={`iv-display-bar ${clamped === 15 ? 'iv-display-full' : ''}`}
              style={{ width: `${barWidth}%` }}
            />
          )}
        </div>
      );
    };

    return (
      <div className="iv-display-container">
        {renderRow('attack', 'Attack')}
        {renderRow('defense', 'Defense')}
        {renderRow('stamina', 'HP')}
      </div>
    );
  }

  // CASE 2 & 3: Edit or Search mode
  const isSearchMode = mode === 'search';

  const handleToggleHundo = () => {
    const newVal = !isHundo;
    setIsHundo(newVal);
    if (newVal) {
      onChange({ attack: 15, defense: 15, stamina: 15 });
    }
  };

  const renderRows = () => {
    if (isSearchMode) {
      // Render rows for search mode (using IVSearch style with updated gauge classes)
      return ['attack', 'defense', 'stamina'].map((statKey) => {
        const label =
          statKey === 'stamina'
            ? 'HP'
            : statKey.charAt(0).toUpperCase() + statKey.slice(1);
        const val = stats[statKey];
        const clamped = clampValue(val);
        const barWidth = getBarWidth(val);

        const handleChange = (e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange({ ...stats, [statKey]: '' });
          } else {
            let parsed = parseInt(raw, 10);
            parsed = isNaN(parsed) ? '' : Math.max(0, Math.min(15, parsed));
            onChange({ ...stats, [statKey]: parsed });
          }
        };

        return (
          <div className="iv-display-stat" key={statKey}>
            <span className="iv-label">{label}:</span>
            <div className="iv-content">
              <input
                type="number"
                className="iv-input"
                value={val == null ? '' : val}
                onChange={handleChange}
                min="0"
                max="15"
                disabled={isHundo}
              />
            </div>
            {/* Updated gauge classes */}
            <div className="iv-display-bar-bg" />
            {val !== '' && val != null && (
              <div
                className={`iv-display-bar ${clamped === 15 ? 'iv-display-full' : ''}`}
                style={{ width: `${barWidth}%` }}
              />
            )}
          </div>
        );
      });
    } else {
      // Render rows for owned-instance style
      const inputRefs = {
        Attack: useRef(null),
        Defense: useRef(null),
        Stamina: useRef(null),
      };

      useEffect(() => {
        if (editMode) {
          Object.values(inputRefs).forEach((ref) => {
            if (ref.current) {
              ref.current.focus();
              ref.current.select();
            }
          });
        }
      }, [editMode]);

      const sanitizedIvs = Object.fromEntries(
        Object.entries(ivs).map(([key, val]) => [key, val === '' ? null : val])
      );

      const handleKeyPress = (event, type) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (inputRefs[type].current) {
            inputRefs[type].current.blur();
          }
        }
      };

      return ['Attack', 'Defense', 'Stamina'].map((type) => {
        const val = sanitizedIvs[type];
        const clamped = clampValue(val);
        const barWidth = getBarWidth(val);

        const handleIvChange = (e) => {
          const rawVal = e.target.value;
          if (rawVal === '') {
            onIvChange({ ...sanitizedIvs, [type]: null });
          } else {
            let parsed = parseInt(rawVal, 10);
            parsed = isNaN(parsed) ? null : Math.max(0, Math.min(15, parsed));
            onIvChange({ ...sanitizedIvs, [type]: parsed });
          }
        };

        const label = type === 'Stamina' ? 'HP' : type;

        return (
          <div className="iv-display" key={type}>
            <span className="iv-label">{label}:</span>
            <div className="iv-content">
              {editMode ? (
                <input
                  type="number"
                  ref={inputRefs[type]}
                  value={val == null ? '' : val}
                  onChange={handleIvChange}
                  onKeyPress={(e) => handleKeyPress(e, type)}
                  min="0"
                  max="15"
                  className="iv-input"
                  placeholder="—"
                />
              ) : (
                <span className="iv-value">{val == null || val === '' ? '—' : val}</span>
              )}
            </div>
            <div className="iv-display-bar-bg" />
            <div
              className={`iv-display-bar ${clamped === 15 ? 'iv-display-full' : ''}`}
              style={{ width: val == null ? '0%' : `${barWidth}%` }}
            />
          </div>
        );
      });
    }
  };

  return (
    <div className="iv-container">
      {isSearchMode && (
        <div className="iv-hundo-toggle">
          <label>
            <input type="checkbox" checked={isHundo} onChange={handleToggleHundo} />
            Hundo
          </label>
        </div>
      )}
      {renderRows()}
    </div>
  );
};

export default IV;