// ListItems.jsx

import React from 'react';
import './ListItems.css';

const ListItems = ({ listNames, activeLists, sortedOwnedPokemons, onSelectList }) => {
  return listNames.map((listName) => {
    let listData = [];
    if (listName === 'Owned' || listName === 'Caught') {
      listData = sortedOwnedPokemons;
    } else {
      const lower = listName.toLowerCase();
      listData = activeLists[lower] ? Object.values(activeLists[lower]) : [];
    }

    const previewPokemon = listData.slice(0, 24).map((pokemon, index) => {
      if (!pokemon || !pokemon.currentImage) return null;
      const hasDynamax = pokemon.variantType?.includes('dynamax');
      const hasGigantamax = pokemon.variantType?.includes('gigantamax');
      let overlaySrc = '';
      if (hasGigantamax) {
        overlaySrc = `${process.env.PUBLIC_URL}/images/gigantamax.png`;
      } else if (hasDynamax) {
        overlaySrc = `${process.env.PUBLIC_URL}/images/dynamax.png`;
      }
      const isUnowned = listName === 'Unowned';
      return (
        <div key={pokemon.id || index} className="pokemon-list-container">
          <img
            src={pokemon.currentImage}
            alt={pokemon.name || 'Unknown Pokémon'}
            className={`preview-image ${isUnowned ? 'unowned' : ''}`}
          />
          {overlaySrc && (
            <img
              src={overlaySrc}
              alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
              className={`variant-overlay ${isUnowned ? 'unowned' : ''}`}
              aria-hidden="true"
            />
          )}
        </div>
      );
    });

    const filterName = listName === 'Caught' ? 'Owned' : listName;
    return (
      <div
        key={listName}
        className="list-item"
        onClick={() => onSelectList(filterName)}
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSelectList(filterName);
        }}
      >
        <div className={`list-header ${listName}`}>{listName}</div>
        <div className="pokemon-preview">
          {previewPokemon.length > 0 ? (
            previewPokemon
          ) : (
            <p className="no-pokemon-text">No Pokémon in this list</p>
          )}
        </div>
      </div>
    );
  });
};

export default ListItems;
