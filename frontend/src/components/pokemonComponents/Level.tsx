// OwnedComponents/LevelComponent.tsx

import React from 'react';
import './Level.css';

type Props = {
  editMode: boolean;
  level: number | null;
  onLevelChange: (level: string) => void;
};

const Level: React.FC<Props> = ({ editMode, level, onLevelChange }) => {
  return (
    <div className="level-component">
      {editMode || level !== null ? (
        <div className="level-inline">
          <span className="level-label">Level:</span>
          {editMode ? (
            <input
              type="number"
              value={level !== null ? level : ''}
              onChange={(e) => onLevelChange(e.target.value)}
              min={1}
              max={51}
              className="level-input"
              placeholder="1-51"
            />
          ) : (
            <span className="level-value">{level !== null ? level : 'N/A'}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Level;
