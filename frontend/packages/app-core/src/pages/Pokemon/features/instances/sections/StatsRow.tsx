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
  addBottomGap?: boolean;
}

const StatsRow: React.FC<StatsRowProps> = ({
  pokemon,
  editMode,
  onWeightChange,
  onHeightChange,
  addBottomGap = false,
}) => {
  const showWeight = editMode || Boolean(pokemon.instanceData?.weight);
  const showHeight = editMode || Boolean(pokemon.instanceData?.height);
  const containerClassName = `weight-type-height-container${
    !showWeight && !showHeight ? ' only-type' : ''
  }${addBottomGap ? ' terminal-spacing' : ''}`;

  return (
    <div className={containerClassName}>
      {showWeight ? (
        <div className="weight-container">
          <Weight
            pokemon={pokemon}
            editMode={editMode}
            onWeightChange={onWeightChange}
          />
        </div>
      ) : null}
      {showWeight ? (
        <span className="stats-pipe" aria-hidden="true">
          |
        </span>
      ) : null}
      <Types pokemon={pokemon} />
      {showHeight ? (
        <span className="stats-pipe" aria-hidden="true">
          |
        </span>
      ) : null}
      {showHeight ? (
        <div className="height-container">
          <Height
            pokemon={pokemon}
            editMode={editMode}
            onHeightChange={onHeightChange}
          />
        </div>
      ) : null}
    </div>
  );
};

export default StatsRow;

