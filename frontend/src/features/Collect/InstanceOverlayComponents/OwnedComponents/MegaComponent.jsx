// MegaComponent.jsx

import React from 'react';
import './MegaComponent.css';

const MegaComponent = ({
  megaData,
  setMegaData,
  editMode,
  megaEvolutions = []
}) => {
  if (!editMode) return null;

  const handleClick = () => {
    const { isMega, mega, megaForm } = megaData;

    if (!isMega) {
      // Activate Mega
      setMegaData({
        isMega: true,
        mega: true,
        megaForm: megaEvolutions.length > 0 ? megaEvolutions[0].form : null,
      });
    } else {
      if (megaEvolutions.length === 1) {
        // Deactivate Mega
        setMegaData({
          isMega: false,
          mega: true,
          megaForm: null,
        });
      } else {
        // Cycle through Mega Forms
        const currentIndex = megaEvolutions.findIndex(
          me => me.form.toLowerCase() === megaForm?.toLowerCase()
        );
        const nextIndex = (currentIndex + 1) % megaEvolutions.length;
        const nextForm = megaEvolutions[nextIndex].form;

        if (nextIndex === 0) {
          // If cycling back to first form, deactivate Mega
          setMegaData({
            isMega: false,
            mega: false,
            megaForm: null,
          });
        } else {
          // Switch to next Mega form
          setMegaData({
            isMega: true,
            mega: true,
            megaForm: nextForm,
          });
        }
      }
    }
  };

  const { isMega, megaForm } = megaData;

  const formLabel = megaForm 
    ? `Mega ${megaForm}`
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
