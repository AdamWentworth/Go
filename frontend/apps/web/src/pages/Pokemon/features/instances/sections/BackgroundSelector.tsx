import React from 'react';
import './BackgroundSelector.css';

interface BackgroundSelectorProps {
  canPick: boolean;
  editMode: boolean;
  onToggle: () => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  canPick,
  editMode,
  onToggle,
}) => {
  if (!canPick) return null;
  return (
    <div className={`background-select-row ${editMode ? 'active' : ''}`}>
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
