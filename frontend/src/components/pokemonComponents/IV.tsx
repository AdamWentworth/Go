// IV.tsx

import React, { useRef } from 'react';
import './IV.css';

type StatKey = 'Attack' | 'Defense' | 'Stamina';

type Props = {
  ivs?: Record<StatKey, number | '' | null>;
  editMode?: boolean;
  onIvChange: (newIVs: Record<StatKey, number | '' | null>) => void;
  mode?: 'search' | 'edit' | string;
  isHundo?: boolean;
  setIsHundo?: (value: boolean) => void;
};

const IV: React.FC<Props> = ({
  ivs = { Attack: '', Defense: '', Stamina: '' },
  editMode = false,
  onIvChange,
  mode,
  isHundo = false,
  setIsHundo = () => {},
}) => {
  const isSearchMode = mode === 'search';

  const inputRefs: Record<StatKey, React.RefObject<HTMLInputElement | null>> = {
    Attack: useRef<HTMLInputElement>(null),
    Defense: useRef<HTMLInputElement>(null),
    Stamina: useRef<HTMLInputElement>(null),
  };  

  const clampValue = (val: number | string | null): number => {
    const n = parseInt(String(val), 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(15, n));
  };

  const getBarWidth = (val: number | string | null): number => (clampValue(val) / 15) * 75;

  const sanitizedIvs = Object.fromEntries(
    Object.entries(ivs).map(([key, val]) => [key, val === '' ? null : val])
  ) as Record<StatKey, number | null>;

  return (
    <>
      {!isSearchMode && !editMode && (
        <div className="iv-display-container">
          {(['Attack', 'Defense', 'Stamina'] as StatKey[]).map((statKey) => {
            const label = statKey === 'Stamina' ? 'HP' : statKey;
            const val = sanitizedIvs[statKey];
            const clamped = clampValue(val);
            const barWidth = getBarWidth(val);

            return (
              <div className="iv-display-stat" key={statKey}>
                <span className="iv-display-label">{label}:</span>
                <div className="iv-display-content">
                  <span className="iv-display-value">{val ?? ''}</span>
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
          })}
        </div>
      )}

      {isSearchMode && (
        <>
          <div className="iv-controls">
            <img
              src="/images/reset.png"
              alt="Reset"
              className="iv-reset-image"
              onClick={() => {
                onIvChange({ Attack: null, Defense: null, Stamina: null });
                setIsHundo(false);
              }}
            />
            <img
              src="/images/hundo.png"
              alt="Hundo"
              className="iv-hundo-image"
              onClick={() => {
                const newVal = !isHundo;
                setIsHundo(newVal);
                if (newVal) {
                  onIvChange({ Attack: 15, Defense: 15, Stamina: 15 });
                }
              }}
            />
          </div>
          {(['Attack', 'Defense', 'Stamina'] as StatKey[]).map((statKey) => {
            const label = statKey === 'Stamina' ? 'HP' : statKey;
            const val = ivs[statKey];
            const barWidth = getBarWidth(val);
            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              const parsed = raw === '' ? '' : Math.min(15, Math.max(0, parseInt(raw, 10)));
              onIvChange({ ...ivs, [statKey]: isNaN(parsed as number) ? '' : parsed });
            };

            return (
              <div className="iv-display-stat" key={statKey}>
                <span className="iv-label">{label}:</span>
                <div className="iv-content">
                  <input
                    type="number"
                    className="iv-input"
                    value={val ?? ''}
                    onChange={handleChange}
                    min={0}
                    max={15}
                    disabled={isHundo}
                  />
                </div>
                <div className="iv-display-bar-bg" />
                {val !== '' && val != null && (
                  <div
                    className={`iv-display-bar ${clampValue(val) === 15 ? 'iv-display-full' : ''}`}
                    style={{ width: `${barWidth}%` }}
                  />
                )}
              </div>
            );
          })}
        </>
      )}

      {!isSearchMode && editMode && (
        <>
          {(['Attack', 'Defense', 'Stamina'] as StatKey[]).map((type) => {
            const label = type === 'Stamina' ? 'HP' : type;
            const val = sanitizedIvs[type];
            const clamped = clampValue(val);
            const barWidth = getBarWidth(val);

            const handleIvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              const parsed = raw === '' ? null : Math.min(15, Math.max(0, parseInt(raw, 10)));
              onIvChange({ ...sanitizedIvs, [type]: isNaN(parsed as number) ? null : parsed });
            };

            const handleKeyPress = (e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                inputRefs[type].current?.blur();
              }
            };

            return (
              <div className="iv-display" key={type}>
                <span className="iv-label">{label}:</span>
                <div className="iv-content">
                  <input
                    type="number"
                    ref={inputRefs[type]}
                    value={val ?? ''}
                    onChange={handleIvChange}
                    onKeyPress={handleKeyPress}
                    min={0}
                    max={15}
                    className="iv-input"
                    placeholder="—"
                  />
                </div>
                <div className="iv-display-bar-bg" />
                <div
                  className={`iv-display-bar ${clamped === 15 ? 'iv-display-full' : ''}`}
                  style={{ width: val == null ? '0%' : `${barWidth}%` }}
                />
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

export default IV;
