import React from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';

interface MetaPanelProps {
  pokemon: Record<string, unknown>;
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
        pokemon={pokemon as never}
        editMode={editMode}
        onLocationChange={onLocationChange}
      />
    </div>

    <div className="date-caught-component">
      <DateCaughtComponent
        pokemon={pokemon as never}
        editMode={editMode}
        onDateChange={onDateChange}
      />
    </div>
  </>
);

export default MetaPanel;
