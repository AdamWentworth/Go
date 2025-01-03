// MegaComponent.jsx

import React from 'react';
import './MegaComponent.css';

const MegaComponent = ({
  isMega,
  onToggleMega,
  editMode,
  megaEvolutions = [],
  currentMegaForm
}) => {
  if (!editMode) return null;

  const handleClick = () => {
    if (!isMega) {
      // If not mega, enable mega and set to first form
      onToggleMega(true);
    } else {
      if (megaEvolutions.length === 1) {
        // If only one mega form, toggle back to normal
        onToggleMega(false);
      } else {
        // Multiple mega forms
        const currentIndex = currentMegaForm 
          ? megaEvolutions.findIndex(me => me.form === currentMegaForm)
          : -1;
        
        if (currentIndex === megaEvolutions.length - 1) {
          // If on last form, return to normal
          onToggleMega(false);
        } else {
          // Move to next form
          const nextForm = megaEvolutions[currentIndex + 1].form;
          onToggleMega(true, nextForm);
        }
      }
    }
  };

  // Get current form label for title
  const formLabel = currentMegaForm 
    ? `Mega ${currentMegaForm}`
    : isMega 
      ? 'Mega'
      : 'Normal';

  return (
    <div className="mega-component">
      <img
        src={`${process.env.PUBLIC_URL}/images/mega.png`}
        alt="Mega Toggle"
        className={`mega-image ${isMega ? 'saturated' : 'desaturated'}`}
        onClick={handleClick}
        title={formLabel}
      />
    </div>
  );
};

export default MegaComponent;
