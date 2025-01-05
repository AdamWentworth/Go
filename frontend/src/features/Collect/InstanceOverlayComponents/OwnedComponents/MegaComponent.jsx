// OwnedComponents/MegaComponent.jsx

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
    const { isMega, megaForm } = megaData;

    if (!isMega) {
      // Activate Mega with the first available Mega form
      setMegaData({
        isMega: true,
        mega: true,
        megaForm: megaEvolutions.length > 0 ? megaEvolutions[0].form : null,
      });
    } else {
      if (megaEvolutions.length === 1) {
        // Deactivate Mega if only one Mega form exists
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
        const nextIndex = (currentIndex + 1) % (megaEvolutions.length + 1); // +1 to include deactivation
        if (nextIndex === megaEvolutions.length) {
          // Deactivate Mega after cycling through all forms
          setMegaData({
            isMega: false,
            mega: true,
            megaForm: null,
          });
        } else {
          // Switch to the next Mega form
          const nextForm = megaEvolutions[nextIndex].form;
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
