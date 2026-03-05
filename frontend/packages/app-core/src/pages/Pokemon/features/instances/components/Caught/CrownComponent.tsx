import React from 'react';
import './CrownComponent.css';
import type { CrownForm } from '@/types/pokemonSubTypes';
import { getCrownFormLabel, resolveActiveCrownForm } from '@/utils/crownHelpers';

interface CrownData {
  isCrown: boolean;
  crownForm: string | null;
}

interface CrownComponentProps {
  crownData: CrownData;
  setCrownData: React.Dispatch<React.SetStateAction<CrownData>>;
  editMode: boolean;
  crownForms?: CrownForm[];
  isShadow: boolean;
}

const CrownComponent: React.FC<CrownComponentProps> = ({
  crownData,
  setCrownData,
  editMode,
  crownForms = [],
  isShadow,
}) => {
  if (!Array.isArray(crownForms) || crownForms.length === 0 || isShadow) {
    return null;
  }

  const activeForm = resolveActiveCrownForm(crownForms, crownData.crownForm);
  const imageUrl =
    activeForm?.image_url ?? '/images/default_pokemon.png';
  const formLabel = getCrownFormLabel(activeForm) ?? 'Crown';

  const handleClick = () => {
    if (!editMode) return;

    setCrownData((prev) => {
      if (!prev.isCrown) {
        return {
          isCrown: true,
          crownForm: formLabel,
        };
      }

      if (crownForms.length <= 1) {
        return {
          isCrown: false,
          crownForm: null,
        };
      }

      const currentIndex = crownForms.findIndex(
        (entry) => getCrownFormLabel(entry)?.toLowerCase() === prev.crownForm?.toLowerCase(),
      );
      const nextIndex = (currentIndex + 1) % (crownForms.length + 1);
      if (nextIndex === crownForms.length) {
        return {
          isCrown: false,
          crownForm: null,
        };
      }

      return {
        isCrown: true,
        crownForm: getCrownFormLabel(crownForms[nextIndex]),
      };
    });
  };

  return (
    <div className={`crown-component ${editMode ? 'edit-mode' : ''}`}>
      <img
        src={imageUrl}
        alt="Crown Toggle"
        className={`crown-image ${crownData.isCrown ? 'saturated' : 'desaturated'} ${
          editMode ? 'interactive' : 'static-mode'
        }`}
        onClick={handleClick}
        title={crownData.isCrown ? formLabel : 'Normal'}
      />
    </div>
  );
};

export default CrownComponent;
