// ListView.jsx

import React, { useEffect, useState, useRef } from 'react';
import './ListView.css';
import OwnedListView from './OwnedListView';
import TradeListView from './TradeListView';
import WantedListView from './WantedListView';

const ListView = ({ data, ownershipStatus, hasSearched, pokemonCache, scrollToTopTrigger }) => {
  const [pokemonVariants, setPokemonVariants] = useState([]);
  const listViewRef = useRef(null);

  console.log(data)

  useEffect(() => {
    if (pokemonCache) {
      setPokemonVariants(pokemonCache);
    }
  }, [pokemonCache]);

  // Scroll to top when scrollToTopTrigger changes
  useEffect(() => {
    if (listViewRef.current) {
      listViewRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [scrollToTopTrigger]);

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
          return <WantedListView key={index} item={item} findPokemonByKey={findPokemonByKey} />;
        }
        return null;
      })}
    </div>
  );
};

export default ListView;