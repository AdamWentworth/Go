// sections/MetaPanel.jsx
import React from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';

const MetaPanel = ({ pokemon, editMode, onLocationChange, onDateChange }) => (
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