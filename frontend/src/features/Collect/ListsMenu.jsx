// ListsMenu.jsx

import React from 'react';
import './ListsMenu.css';

// Import the sorting hook for the Owned list
import useFavoriteList from '../../hooks/sort/useFavoriteList';

const ListsMenu = ({
  onSelectList,
  activeLists
}) => {
  // Define the lists for each column
  const leftColumnLists = ['Owned', 'Trade'];
  const rightColumnLists = ['Wanted', 'Unowned'];

  // Apply sorting hook only to the 'Owned' list
  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : []
  );

  // Function to render the list items
  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      let listData = [];

      if (listName === 'Owned') {
        // Use the sorted data for Owned list
        listData = sortedOwnedPokemons;
      } else {
        // For other lists, use the original data
        listData = activeLists[listName.toLowerCase()]
          ? Object.values(activeLists[listName.toLowerCase()])
          : [];
      }

      const previewPokemon = listData.slice(0, 24).map((pokemon, index) => {
        if (!pokemon || !pokemon.currentImage) {
          console.log('No currentImage found for:', pokemon?.id || `index ${index}`);
          return null;
        }

        // Determine if the Pokémon has a variant
        const hasDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');
        const hasGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');

        // Decide which overlay to display
        let overlaySrc = '';
        if (hasGigantamax) {
          overlaySrc = `${process.env.PUBLIC_URL}/images/gigantamax.png`;
        } else if (hasDynamax) {
          overlaySrc = `${process.env.PUBLIC_URL}/images/dynamax.png`;
        }

        // Determine if the current list is 'Unowned'
        const isUnowned = listName === 'Unowned';

        return (
          <div key={pokemon.id || index} className="pokemon-list-container">
            <img
              src={pokemon.currentImage}
              alt={pokemon.name || 'Unknown Pokémon'}
              className={`preview-image ${isUnowned ? 'unowned' : ''}`}
            />
            {/* Conditionally render the Variant overlay */}
            {overlaySrc && (
              <img
                src={overlaySrc}
                alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
                className={`variant-overlay ${isUnowned ? 'unowned' : ''}`}
                aria-hidden="true" // Hides the image from screen readers
              />
            )}
          </div>
        );
      });

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(listName)}
          tabIndex="0" /* Make it focusable for accessibility */
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSelectList(listName);
          }}
        >
          <div className={`list-header ${listName}`}>
            {listName}
          </div>
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

  return (
    <div className="lists-menu">
      <div className="column">
        {/* Left Column Lists */}
        {renderListItems(leftColumnLists)}
      </div>
      <div className="column">
        {/* Right Column Lists */}
        {renderListItems(rightColumnLists)}
      </div>
    </div>
  );
};

export default ListsMenu;
