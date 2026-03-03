import React from 'react';
import './BallCaught.css';

const BALL_OPTIONS = [
  { value: 'poke_ball', label: 'POKE BALL' },
  { value: 'great_ball', label: 'GREAT BALL' },
  { value: 'ultra_ball', label: 'ULTRA BALL' },
  { value: 'premier_ball', label: 'PREMIER BALL' },
  { value: 'master_ball', label: 'MASTER BALL' },
  { value: 'beast_ball', label: 'BEAST BALL' },
] as const;

type BallValue = (typeof BALL_OPTIONS)[number]['value'];

type BallCaughtProps = {
  value: string | null;
  editMode: boolean;
  onChange: (value: string | null) => void;
};

const toBallLabel = (value: string | null): string => {
  if (!value) return 'UNKNOWN';
  const found = BALL_OPTIONS.find((option) => option.value === value);
  if (found) return found.label;
  return value.replace(/_/g, ' ').toUpperCase();
};

const BallCaught: React.FC<BallCaughtProps> = ({ value, editMode, onChange }) => {
  if (!editMode) {
    return (
      <div className="ball-caught-container">
        <label>Ball Caught</label>
        <span className="ball-caught-value">{toBallLabel(value)}</span>
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

