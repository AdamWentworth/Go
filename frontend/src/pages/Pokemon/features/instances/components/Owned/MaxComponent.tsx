// MaxComponent.tsx

import React from 'react';
import './MaxComponent.css';
import type { MaxForm } from '@/types/pokemonSubTypes';

interface instanceData {
  shadow: boolean;
  purified: boolean;
}

interface PokemonProps {
  max: MaxForm[];
  instanceData: instanceData;
  variantType?: string;
  pokemonKey: string;
}

interface MaxComponentProps {
  pokemon: PokemonProps;
  editMode: boolean;
  dynamax: boolean;
  gigantamax: boolean;
  onToggleMax: () => void;
  showMaxOptions: boolean;
}

const MaxComponent: React.FC<MaxComponentProps> = ({
  pokemon,
  editMode,
  dynamax,
  gigantamax,
  onToggleMax,
  showMaxOptions
}) => {
  const hasMaxVariant =
    pokemon.variantType &&
    (pokemon.variantType.includes('dynamax') || pokemon.variantType.includes('gigantamax'));

  if (
    !editMode ||
    !hasMaxVariant ||
    !Array.isArray(pokemon.max) ||
    pokemon.max.length === 0 ||
    pokemon.instanceData.shadow ||
    pokemon.instanceData.purified ||
    (pokemon.variantType && pokemon.variantType.includes('costume'))
  ) {
    return null;
  }

  const maxEntry: MaxForm | undefined = pokemon.max[0];
  if (!maxEntry) return null;

  return (
    <div className="max-component">
      <div 
        className="max-icon"
        onClick={onToggleMax}
        style={{ cursor: 'pointer' }}
        aria-expanded={showMaxOptions}
        aria-controls={`max-options-${pokemon.pokemonKey}`}
      >
        <img
          src={
            gigantamax
              ? '/images/gigantamax-icon.png'
              : '/images/dynamax-icon.png'
          }
          alt={gigantamax ? 'Gigantamax' : 'Dynamax'}
          className={gigantamax || dynamax ? 'saturated' : 'desaturated'}
        />
      </div>
    </div>
  );
};

export default MaxComponent;
