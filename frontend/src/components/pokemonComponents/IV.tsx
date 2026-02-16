// IV.tsx

import React, { useRef } from 'react';
import './IV.css';

type StatKey = 'Attack' | 'Defense' | 'Stamina';

type IvValues = Record<StatKey, number | '' | null>;

type LegacyIvItem = {
  attack_iv?: number | string | null;
  defense_iv?: number | string | null;
  stamina_iv?: number | string | null;
};

type Props = {
  ivs?: IvValues;
  // Compatibility for legacy callers that still pass full instance payloads.
  item?: LegacyIvItem | null;
  editMode?: boolean;
  onIvChange?: (newIVs: IvValues) => void;
  mode?: 'search' | 'edit' | string;
  isHundo?: boolean;
  setIsHundo?: (value: boolean) => void;
};

const DEFAULT_IVS: IvValues = { Attack: '', Defense: '', Stamina: '' };

const toIvNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const toLegacyIvs = (item?: LegacyIvItem | null): IvValues => ({
  Attack: toIvNumber(item?.attack_iv),
  Defense: toIvNumber(item?.defense_iv),
  Stamina: toIvNumber(item?.stamina_iv),
});

const IV: React.FC<Props> = ({
  ivs,
  item,
  editMode = false,
  onIvChange,
  mode,
  isHundo = false,
  setIsHundo = () => {},
}) => {
  const isSearchMode = mode === 'search';
  const emitIvChange = onIvChange ?? (() => {});
  const activeIvs: IvValues = ivs ?? (item ? toLegacyIvs(item) : DEFAULT_IVS);

  const inputRefs: Record<StatKey, React.RefObject<HTMLInputElement | null>> = {
    Attack: useRef<HTMLInputElement>(null),
    Defense: useRef<HTMLInputElement>(null),
    Stamina: useRef<HTMLInputElement>(null),
  };

  const clampValue = (val: number | string | null): number => {
    const n = parseInt(String(val), 10);
    return Number.isNaN(n) ? 0 : Math.max(0, Math.min(15, n));
  };

  const getBarWidth = (val: number | string | null): number =>
    (clampValue(val) / 15) * 75;

  const sanitizedIvs = Object.fromEntries(
    Object.entries(activeIvs).map(([key, val]) => [key, val === '' ? null : val]),
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
                emitIvChange({ Attack: null, Defense: null, Stamina: null });
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
                  emitIvChange({ Attack: 15, Defense: 15, Stamina: 15 });
                }
              }}
            />
          </div>
          {(['Attack', 'Defense', 'Stamina'] as StatKey[]).map((statKey) => {
            const label = statKey === 'Stamina' ? 'HP' : statKey;
            const val = activeIvs[statKey];
            const barWidth = getBarWidth(val);
            const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              const parsed =
                raw === '' ? '' : Math.min(15, Math.max(0, parseInt(raw, 10)));
              emitIvChange({
                ...activeIvs,
                [statKey]: Number.isNaN(parsed as number) ? '' : parsed,
              });
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
              const parsed =
                raw === '' ? null : Math.min(15, Math.max(0, parseInt(raw, 10)));
              emitIvChange({
                ...sanitizedIvs,
                [type]: Number.isNaN(parsed as number) ? null : parsed,
              });
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
                    placeholder="-"
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
