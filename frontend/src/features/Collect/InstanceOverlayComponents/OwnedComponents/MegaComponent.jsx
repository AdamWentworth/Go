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
      onToggleMega(true);
    } else {
      if (megaEvolutions.length === 1) {
        onToggleMega(false);
      } else {
        const currentIndex = currentMegaForm 
          ? megaEvolutions.findIndex(me => me.form === currentMegaForm)
          : -1;
        
        if (currentIndex === megaEvolutions.length - 1) {
          onToggleMega(false);
        } else {
          const nextForm = megaEvolutions[currentIndex + 1].form;
          onToggleMega(true, nextForm);
        }
      }
    }
  };

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
