import React from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  instanceData?: Pick<PokemonInstance, 'location_caught' | 'date_caught'>;
};

interface MetaPanelProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

const MetaPanel: React.FC<MetaPanelProps> = ({
  pokemon,
  editMode,
  onLocationChange,
  onDateChange,
}) => (
  <>
    <div className="location-caught-component">
      <LocationCaught
        pokemon={pokemon}
        editMode={editMode}
        onLocationChange={onLocationChange}
      />
    </div>

    <div className="date-caught-component">
      <DateCaughtComponent
        pokemon={pokemon}
        editMode={editMode}
        onDateChange={onDateChange}
      />
    </div>
  </>
);

export default MetaPanel;

