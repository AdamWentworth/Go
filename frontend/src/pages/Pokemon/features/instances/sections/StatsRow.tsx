import React from 'react';
import './StatsRow.css';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  type1_name?: PokemonVariant['type1_name'];
  type2_name?: PokemonVariant['type2_name'];
  type_1_icon?: PokemonVariant['type_1_icon'];
  type_2_icon?: PokemonVariant['type_2_icon'];
  sizes?: PokemonVariant['sizes'];
  instanceData?: Pick<PokemonInstance, 'weight' | 'height'>;
};

interface StatsRowProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  onWeightChange: (value: string | number) => void;
  onHeightChange: (value: string | number) => void;
}

const StatsRow: React.FC<StatsRowProps> = ({
  pokemon,
  editMode,
  onWeightChange,
  onHeightChange,
}) => (
  <div className="weight-type-height-container">
    <div className="weight-container">
      <Weight
        pokemon={pokemon}
        editMode={editMode}
        onWeightChange={onWeightChange}
      />
    </div>
    <Types pokemon={pokemon} />
    <div className="height-container">
      <Height
        pokemon={pokemon}
        editMode={editMode}
        onHeightChange={onHeightChange}
      />
    </div>
  </div>
);

export default StatsRow;

