// MegaComponent.tsx

import React from 'react';
import './MegaComponent.css';
import type { MegaData } from '../../utils/buildInstanceChanges';
import type { MegaEvolution } from '@/types/pokemonSubTypes';

interface MegaComponentProps {
  megaData: MegaData;
  setMegaData: React.Dispatch<React.SetStateAction<MegaData>>;
  editMode: boolean;
  megaEvolutions?: MegaEvolution[];
  isShadow: boolean;
  name?: string;
}

const MegaComponent: React.FC<MegaComponentProps> = ({
  megaData,
  setMegaData,
  editMode,
  megaEvolutions = [],
  isShadow,
  name,
}) => {
  if (
    !megaEvolutions ||
    megaEvolutions.length === 0 ||
    isShadow ||
    (name && name.toLowerCase().includes("clone"))
  ) {
    return null; // Do not render anything if conditions are not met
  }

  const handleClick = () => {
    if (!editMode) return; // Only toggleable when editMode is true

    const { isMega, megaForm } = megaData;

    if (!isMega) {
      // Activate Mega with the first available Mega form
      setMegaData({
        isMega: true,
        mega: true,
        megaForm: megaEvolutions.length > 0 ? megaEvolutions[0].form ?? null : null,
      });
    } else {
      if (megaEvolutions.length === 1) {
        // Deactivate Mega if only one Mega form exists
        setMegaData({
          isMega: false,
          megaForm: null,
          mega: true,
        });
      } else {
        // Cycle through Mega Forms
        const currentIndex = megaEvolutions.findIndex(
          (me) => (me.form ?? '').toLowerCase() === (megaForm ?? '').toLowerCase()
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
            megaForm: nextForm ?? null,
          });
        }
      }
    }
  };

  const { isMega } = megaData;

  const formLabel = isMega ? `Mega ${megaData.megaForm || ''}` : 'Normal';

  return (
    <div className={`mega-component ${editMode ? 'edit-mode' : ''}`}>
      {editMode || isMega ? (
        <img
          src={`/images/mega.png`}
          alt="Mega Toggle"
          className={`mega-image ${isMega ? 'saturated' : 'desaturated'} ${
            editMode ? '' : 'static-mode'
          }`}
          onClick={handleClick}
          title={formLabel}
        />
      ) : null}
    </div>
  );
};

export default MegaComponent;
