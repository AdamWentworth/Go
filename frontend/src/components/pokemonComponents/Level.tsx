// Level.tsx

import React from 'react';
import './Level.css';

type Props = {
  editMode: boolean;
  level: number | null;
  onLevelChange: (level: string) => void; // keep string so parent can parse
};

const Level: React.FC<Props> = ({ editMode, level, onLevelChange }) => {
  // Keep min/max here in one place (adjust if your game cap differs)
  const MIN_LEVEL = 1;
  const MAX_LEVEL = 51;

  const snapToHalf = (n: number) => Math.round(n * 2) / 2;

  return (
    <div className="level-component">
      {editMode || level !== null ? (
        <div className="level-inline">
          <span className="level-label">Level:</span>
          {editMode ? (
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={MIN_LEVEL}
              max={MAX_LEVEL}
              value={level ?? ''}
              onChange={(e) => onLevelChange(e.target.value)}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw === '') return;
                const n = Number(raw);
                if (!Number.isFinite(n)) return;
                const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, snapToHalf(n)));
                if (String(clamped) !== raw) onLevelChange(String(clamped));
              }}
              className="level-input"
              placeholder={`${MIN_LEVEL}-${MAX_LEVEL} (0.5 steps)`}
            />
          ) : (
            <span className="level-value">{level ?? 'N/A'}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Level;
