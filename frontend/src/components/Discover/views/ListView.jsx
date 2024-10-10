// ListView.jsx

import React, { useEffect, useState } from 'react';
import './ListView.css';
import OwnedListView from './OwnedListView';
import TradeListView from './TradeListView';
import WantedListView from './WantedListView';

const ListView = ({ data, ownershipStatus, hasSearched, pokemonCache }) => {
  const [pokemonVariants, setPokemonVariants] = useState([]);

  useEffect(() => {
    if (pokemonCache && pokemonCache.data) {
      setPokemonVariants(pokemonCache.data);
    }
  }, [pokemonCache]);

  // Helper function to find Pokémon by key in the cache
  const findPokemonByKey = (baseKey) => {
    return pokemonVariants.find((pokemon) => pokemon.pokemonKey === baseKey);
  };

  if (!hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>Use the Toolbar above to Discover Pokémon near you and Around the World!</p>
      </div>
    );
  }

  if (hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>No Pokémon found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="list-view-container">
      {data.map((item, index) => {
        if (ownershipStatus === 'owned') {
          return <OwnedListView key={index} item={item} />;
        } else if (ownershipStatus === 'trade') {
          return <TradeListView key={index} item={item} findPokemonByKey={findPokemonByKey} />;
        } else if (ownershipStatus === 'wanted') {
          return <WantedListView key={index} item={item} />;
        }
        return null;
      })}
    </div>
  );
};

export default ListView;