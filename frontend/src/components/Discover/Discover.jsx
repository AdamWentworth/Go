// src/components/Discover/Discover.js

import React, { useState } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import GlobeView from './views/GlobeView';

// Sample data for both views
const sampleData = [
  { name: 'Pikachu', location: ' Vancouver', isShiny: true, coordinates: { latitude: 49.2608724, longitude: -123.113952 } },
  { name: 'Bulbasaur', location: 'Vancouver', isShiny: false, coordinates: { latitude: 49.3181, longitude: -123.057 } }
];

const Discover = () => {
  const [view, setView] = useState('list'); // 'list' or 'globe'

  return (
    <div>
      <PokemonSearchBar />

      {/* Toggle between List and Globe views */}
      <div className="view-toggle-buttons">
        <button onClick={() => setView('list')}>List View</button>
        <button onClick={() => setView('globe')}>Globe View</button>
      </div>

      {/* Conditionally render the views based on the current selection */}
      {view === 'list' ? (
        <ListView data={sampleData} />
      ) : (
        <GlobeView data={sampleData} />
      )}
    </div>
  );
};

export default Discover;
