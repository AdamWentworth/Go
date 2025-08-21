// SelectChip.tsx
import React from 'react';
import './SelectChip.css';

interface SelectChipProps {
  selected: boolean;
  /** kept for backward-compat; ignored */
  tooltip?: string;
  labelSelected?: string;
  labelUnselected?: string;
  /** hover reveal delay (ms) */
  delayMs?: number;
  onToggle: () => void;
  className?: string;
}

type CSSVars = React.CSSProperties & { ['--reveal-delay']?: string };

const SelectChip: React.FC<SelectChipProps> = ({
  selected,
  /* tooltip unused */ tooltip,
  labelSelected = 'Selected',
  labelUnselected = 'Select',
  delayMs = 500,
  onToggle,
  className = '',
}) => {
  const style: CSSVars = { ['--reveal-delay']: `${delayMs}ms` };

  return (
    <button
      className={`select-chip ${selected ? 'selected' : ''} ${className}`}
      aria-pressed={selected}
      aria-label={selected ? 'Deselect for tagging' : 'Select for tagging'}
      // prevent mouse clicks from leaving focus (so chip won’t “stick” via focus)
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={style}
    >
      <span className="select-chip-icon">✓</span>
      <span className="select-chip-text">
        {selected ? labelSelected : labelUnselected}
      </span>
    </button>
  );
};

export default SelectChip;