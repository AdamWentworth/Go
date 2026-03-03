import React from 'react';
import './MovesAndIV.css';
import Moves, { type MovesProps } from '@/components/pokemonComponents/Moves';
import IV from '@/components/pokemonComponents/IV';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  moves?: PokemonVariant['moves'];
  fusion?: PokemonVariant['fusion'];
  instanceData?: Partial<PokemonInstance>;
};
interface IvValues {
  Attack: number | '' | null;
  Defense: number | '' | null;
  Stamina: number | '' | null;
}

interface MovesAndIVProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  onMovesChange: MovesProps['onMovesChange'];
  isShadow: boolean;
  isPurified: boolean;
  ivs: IvValues;
  onIvChange: (value: IvValues) => void;
  areIVsEmpty: boolean;
}

const MovesAndIV: React.FC<MovesAndIVProps> = ({
  pokemon,
  editMode,
  onMovesChange,
  isShadow,
  isPurified,
  ivs,
  onIvChange,
  areIVsEmpty,
}) => (
  <>
    <div className="moves-content">
      <Moves
        pokemon={pokemon}
        editMode={editMode}
        onMovesChange={onMovesChange}
        isShadow={isShadow}
        isPurified={isPurified}
      />
    </div>

    {(editMode || !areIVsEmpty) && (
      <div className="iv-component">
        <IV editMode={editMode} onIvChange={onIvChange} ivs={ivs} />
      </div>
    )}
  </>
);

export default MovesAndIV;
