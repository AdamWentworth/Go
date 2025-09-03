// sections/StatsRow.jsx
import React from 'react';
import './StatsRow.css';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';

const StatsRow = ({ pokemon, editMode, onWeightChange, onHeightChange }) => (
  <div className="weight-type-height-container">
    <div className="weight-container">
      <Weight pokemon={pokemon} editMode={editMode} onWeightChange={onWeightChange} />
    </div>
    <Types pokemon={pokemon} />
    <div className="height-container">
      <Height pokemon={pokemon} editMode={editMode} onHeightChange={onHeightChange} />
    </div>
  </div>
);

export default StatsRow;