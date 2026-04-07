import React from 'react';
import './BackgroundSelector.css';

interface BackgroundSelectorProps {
  canPick: boolean;
  editMode: boolean;
  onToggle: () => void;
  variant?: 'row' | 'header';
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  canPick,
  editMode,
  onToggle,
  variant = 'row',
}) => {
  if (!canPick) return null;
  return (
    <div
      className={`background-select-row background-select-row--${variant} ${editMode ? 'active' : ''}`}
    >
      <img
        src="/images/location.png"
        alt="Background Selector"
        className="background-icon"
        onClick={editMode ? onToggle : undefined}
      />
    </div>
  );
};

export default BackgroundSelector;
