// sections/BackgroundSelector.jsx
import React from 'react';
import './BackgroundSelector.css';

const BackgroundSelector = ({ canPick, editMode, onToggle }) => {
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