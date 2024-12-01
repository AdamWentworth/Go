// ListsMenu.jsx

import React from 'react';
import './ListsMenu.css';

const ListsMenu = ({ onSelectList, activeLists, variants }) => {
  // Define the lists for each column
  const leftColumnLists = ['Owned', 'Unowned'];
  const rightColumnLists = ['Trade', 'Wanted'];

  // Function to render the list items
  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      // Access the list data using the lowercase version of the list name
      const listData = activeLists[listName.toLowerCase()] || {};
      const instanceIds = Object.keys(listData);

      // Get up to 20 Pokémon for the preview
      const previewPokemon = instanceIds.slice(0, 24).map((instance_id) => {
        // Extract the pokemonKey using your specific logic
        const basePrefix = instance_id.substring(0, instance_id.lastIndexOf('_'));

        // Find the variant with matching pokemonKey
        const pokemonData = variants.find((variant) => variant.pokemonKey === basePrefix);

        if (!pokemonData) {
          console.log('No matching variant found for:', basePrefix);
          return null;
        }

        return (
          <img
            key={instance_id}
            src={pokemonData.currentImage}
            alt={pokemonData.name}
            className="preview-image"
          />
        );
      });

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(listName)}
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