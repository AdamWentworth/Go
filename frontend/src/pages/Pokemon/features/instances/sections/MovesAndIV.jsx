// sections/MovesAndIV.jsx
import React from 'react';
import './MovesAndIV.css';
import Moves from '@/components/pokemonComponents/Moves';
import IV from '@/components/pokemonComponents/IV';

const MovesAndIV = ({
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