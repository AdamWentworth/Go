import React from 'react';
import './StatsRow.css';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';

interface StatsRowProps {
  pokemon: Record<string, unknown>;
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
        pokemon={pokemon as never}
        editMode={editMode}
        onWeightChange={onWeightChange}
      />
    </div>
    <Types pokemon={pokemon as never} />
    <div className="height-container">
      <Height
        pokemon={pokemon as never}
        editMode={editMode}
        onHeightChange={onHeightChange}
      />
    </div>
  </div>
);

export default StatsRow;
