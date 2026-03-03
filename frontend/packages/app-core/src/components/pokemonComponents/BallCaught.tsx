import React from 'react';
import './BallCaught.css';
import { BALL_OPTIONS, type BallValue, getBallLabel } from './ballAssets';

type BallCaughtProps = {
  value: string | null;
  editMode: boolean;
  onChange: (value: string | null) => void;
};

const BallCaught: React.FC<BallCaughtProps> = ({ value, editMode, onChange }) => {
  if (!editMode) {
    return (
      <div className="ball-caught-container">
        <label>Ball Caught</label>
        <span className="ball-caught-value">{getBallLabel(value)}</span>
      </div>
    );
  }

  return (
    <div className="ball-caught-container">
      <label>Ball Caught</label>
      <div className="ball-caught-toggle-group" role="group" aria-label="Ball Caught">
        {BALL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`ball-caught-toggle ${value === option.value ? 'active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value as BallValue)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className={`ball-caught-toggle ${value == null ? 'active' : ''}`}
          aria-pressed={value == null}
          onClick={() => onChange(null)}
        >
          UNKNOWN
        </button>
      </div>
    </div>
  );
};

export default BallCaught;
