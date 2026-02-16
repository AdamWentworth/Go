import React from 'react';
import './MovesAndIV.css';
import Moves from '@/components/pokemonComponents/Moves';
import IV from '@/components/pokemonComponents/IV';

interface IvValues {
  Attack: number | '' | null;
  Defense: number | '' | null;
  Stamina: number | '' | null;
}

interface MovesAndIVProps {
  pokemon: Record<string, unknown>;
  editMode: boolean;
  onMovesChange: (value: unknown) => void;
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
        pokemon={pokemon as never}
        editMode={editMode}
        onMovesChange={onMovesChange as never}
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
