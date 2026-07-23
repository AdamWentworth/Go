// MaxComponent.tsx

import React from 'react';
import './MaxComponent.css';

type PokemonProps = {
  variant_id?: string;
};

interface MaxComponentProps {
  pokemon: PokemonProps;
  editMode: boolean;
  dynamax: boolean;
  gigantamax: boolean;
  onToggleMax: () => void;
  showMaxOptions: boolean;
  isSpecialMax?: boolean;
}

const MaxComponent: React.FC<MaxComponentProps> = ({
  pokemon,
  editMode,
  dynamax,
  gigantamax,
  onToggleMax,
  showMaxOptions,
  isSpecialMax = false,
}) => {
  const key = pokemon.variant_id ?? '';
  if (!editMode) return null;
  const label = gigantamax ? 'Gigantamax' : isSpecialMax ? 'Max Moves' : 'Dynamax';

  return (
    <div className="max-component">
      <button
        type="button"
        className="max-icon"
        onClick={onToggleMax}
        aria-expanded={showMaxOptions}
        aria-controls={`max-options-${key}`}
        aria-label={`${showMaxOptions ? 'Close' : 'Open'} Max Move upgrades`}
        title={`${showMaxOptions ? 'Close' : 'Open'} Max Move upgrades`}
      >
        <img
          src={
            gigantamax
              ? '/images/gigantamax-icon.png'
              : '/images/dynamax-icon.png'
          }
          alt={label}
          className={gigantamax || dynamax || isSpecialMax ? 'saturated' : 'desaturated'}
        />
      </button>
    </div>
  );
};

export default MaxComponent;
