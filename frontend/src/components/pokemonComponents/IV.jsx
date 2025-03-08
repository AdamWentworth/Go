// IV.jsx

import React, { useRef, useEffect } from 'react';
import './IV.css';

const IV = ({
  // Unified ivs object used in all modes.
  ivs = { Attack: '', Defense: '', Stamina: '' },

  // For edit mode (owned-instance style)
  editMode = false,
  onIvChange = () => {},

  // Mode: "search", "edit", etc.
  mode,
  
  // Search mode extras
  isHundo = false,
  setIsHundo = () => {},
}) => {
  // Helper functions
  const clampValue = (val) => {
    const n = parseInt(val, 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(15, n));
  };

  const getBarWidth = (val) => (clampValue(val) / 15) * 75;
  const isSearchMode = mode === 'search';

  // READ-ONLY MODE: not search and not edit mode.
  if (!isSearchMode && !editMode) {
    const sanitizedIvs = Object.fromEntries(
      Object.entries(ivs).map(([key, val]) => [key, val === '' ? null : val])
    );

    const renderRow = (statKey, label) => {
      const val = sanitizedIvs[statKey];
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
        {renderRow('Attack', 'Attack')}
        {renderRow('Defense', 'Defense')}
        {renderRow('Stamina', 'HP')}
      </div>
    );
  }

  // SEARCH MODE
  if (isSearchMode) {
    // Toggle Hundo: sets all IVs to 15 when enabled.
    const handleToggleHundo = () => {
      const newVal = !isHundo;
      setIsHundo(newVal);
      if (newVal) {
        onIvChange({ Attack: 15, Defense: 15, Stamina: 15 });
      }
    };

    // Reset: clears all IVs (sets them to null) and turns off Hundo.
    const handleReset = () => {
      onIvChange({ Attack: null, Defense: null, Stamina: null });
      setIsHundo(false);
    };

    return (
      <>
        <div className="iv-controls">
          <img
            src={`${process.env.PUBLIC_URL}/images/reset.png`}
            alt="Reset"
            className="iv-reset-image"
            onClick={handleReset}
          />
          <img
            src={`${process.env.PUBLIC_URL}/images/hundo.png`}
            alt="Hundo"
            className="iv-hundo-image"
            onClick={handleToggleHundo}
          />
        </div>
        {['Attack', 'Defense', 'Stamina'].map((statKey) => {
          const label = statKey === 'Stamina' ? 'HP' : statKey;
          const val = ivs[statKey];
          const clamped = clampValue(val);
          const barWidth = getBarWidth(val);

          const handleChange = (e) => {
            const raw = e.target.value;
            if (raw === '') {
              onIvChange({ ...ivs, [statKey]: '' });
            } else {
              let parsed = parseInt(raw, 10);
              parsed = isNaN(parsed) ? '' : Math.max(0, Math.min(15, parsed));
              onIvChange({ ...ivs, [statKey]: parsed });
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
              <div className="iv-display-bar-bg" />
              {val !== '' && val != null && (
                <div
                  className={`iv-display-bar ${clamped === 15 ? 'iv-display-full' : ''}`}
                  style={{ width: `${barWidth}%` }}
                />
              )}
            </div>
          );
        })}
      </>
    );
  } else {
    // EDIT MODE (Owned-instance style)
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

export default IV;