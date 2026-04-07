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
  fusionMoveSource?: MovesProps['fusionMoveSource'];
  isFused?: MovesProps['isFused'];
  ivs: IvValues;
  onIvChange: (value: IvValues) => void;
  areIVsEmpty: boolean;
}

export const hasMovesAndIVContent = ({
  pokemon,
  editMode,
  fusionMoveSource = 'base',
  isFused = false,
  areIVsEmpty,
}: Pick<
  MovesAndIVProps,
  'pokemon' | 'editMode' | 'fusionMoveSource' | 'isFused' | 'areIVsEmpty'
>): boolean => {
  const instanceData = pokemon.instanceData ?? {};
  const hasMovesSection =
    editMode ||
    (isFused && fusionMoveSource === 'fusion_missing') ||
    instanceData.fast_move_id != null ||
    instanceData.charged_move1_id != null ||
    instanceData.charged_move2_id != null;
  const hasIvSection = editMode || !areIVsEmpty;
  return hasMovesSection || hasIvSection;
};

const MovesAndIV: React.FC<MovesAndIVProps> = ({
  pokemon,
  editMode,
  onMovesChange,
  isShadow,
  isPurified,
  fusionMoveSource = 'base',
  isFused = false,
  ivs,
  onIvChange,
  areIVsEmpty,
}) => {
  const showMovesSection =
    editMode ||
    (isFused && fusionMoveSource === 'fusion_missing') ||
    pokemon.instanceData?.fast_move_id != null ||
    pokemon.instanceData?.charged_move1_id != null ||
    pokemon.instanceData?.charged_move2_id != null;
  const showIvSection = editMode || !areIVsEmpty;

  if (!showMovesSection && !showIvSection) {
    return null;
  }

  return (
    <>
      {showMovesSection ? (
        <div className="moves-content">
          <Moves
            pokemon={pokemon}
            editMode={editMode}
            onMovesChange={onMovesChange}
            isShadow={isShadow}
            isPurified={isPurified}
            fusionMoveSource={fusionMoveSource}
            isFused={isFused}
          />
        </div>
      ) : null}

      {showIvSection ? (
        <>
          {showMovesSection ? <div className="moves-stats-divider" aria-hidden="true" /> : null}
          <div className="iv-component">
            <IV editMode={editMode} onIvChange={onIvChange} ivs={ivs} />
          </div>
        </>
      ) : null}
    </>
  );
};

export default MovesAndIV;
