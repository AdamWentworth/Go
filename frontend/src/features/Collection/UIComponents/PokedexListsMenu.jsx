// PokedexListsMenu.jsx

import React from 'react';
import './PokedexListsMenu.css';

const PokedexListsMenu = ({
  // Removed: setIsShiny, setShowCostume, setShowShadow, setShowAll
  // Still available if needed: setOwnershipFilter, setHighlightedCards, setActiveView
  setOwnershipFilter,
  setHighlightedCards,
  setActiveView,
  // For building the previews
  pokedexLists,
  variants,
  onListSelect,
}) => {
  // Remove "all" from the right column
  const leftColumnLists = [
    'default',
    'costume',
    'shadow',
    'mega',
    'dynamax',
    'gigantamax',
    'shadow costume',
  ];

  const rightColumnLists = [
    'shiny',
    'shiny costume',
    'shiny shadow',
    'shiny mega',
    'shiny dynamax',
    'shiny gigantamax'
  ];

  // "All" will be rendered separately spanning both columns.
  const fullWidthList = 'all';

  const displayNameMap = {
    default: 'Default',
    shiny: 'Shiny',
    costume: 'Costume',
    shadow: 'Shadow',
    'shiny costume': 'Shiny Costume',
    'shiny shadow': 'Shiny Shadow',
    'shadow costume': 'Shadow Costume',
    mega: 'Mega/Primal',
    'shiny mega': 'Shiny Mega',
    dynamax: 'Dynamax',
    'shiny dynamax': 'Shiny Dynamax',
    gigantamax: 'Gigantamax',
    'shiny gigantamax': 'Shiny Gigantamax',
    all: 'All'
  };

  /**
   * Convert a list name (e.g., "shiny costume") into
   * a CSS-friendly class name (e.g., "shiny-costume").
   */
  const getClassNameForList = (listName) => {
    return listName.replace(/\s+/g, '-').toLowerCase();
  };

  const handleListClick = (listName) => {
    // Optionally clear any old filters or highlights here
    setOwnershipFilter?.('');
    setHighlightedCards?.(new Set());

    // Simply return the list data when clicked.
    if (onListSelect) {
      if (listName === 'all') {
        onListSelect(variants);
      } else {
        onListSelect(pokedexLists[listName] || []);
      }
    }
    // Switch the view (if needed)
    setActiveView?.('pokemonList');
  };

  const renderListPreview = (listName) => {
    let listData;

    if (listName === 'all') {
      listData = variants; // Show *all* variants
    } else {
      listData = pokedexLists[listName] || [];
    }

    return listData.slice(0, 24).map((pokemon, index) => {
      if (!pokemon || !pokemon.currentImage) return null;
      const vt = (pokemon.variantType || '').toLowerCase();
      const hasDynamax = vt.includes('dynamax');
      const hasGigantamax = vt.includes('gigantamax');

      let overlaySrc = '';
      if (hasGigantamax) {
        overlaySrc = `${process.env.PUBLIC_URL}/images/gigantamax.png`;
      } else if (hasDynamax) {
        overlaySrc = `${process.env.PUBLIC_URL}/images/dynamax.png`;
      }

      return (
        <div key={pokemon.id || index} className="pokedex-pokemon-list-container">
          <img
            src={pokemon.currentImage}
            alt={pokemon.name || 'Unknown Pokémon'}
            className="pokedex-preview-image"
          />
          {overlaySrc && (
            <img
              src={overlaySrc}
              alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
              className="pokedex-variant-overlay"
              aria-hidden="true"
            />
          )}
        </div>
      );
    });
  };

  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      const previewPokemon = renderListPreview(listName);

      return (
        <div
          key={listName}
          className="pokedex-list-item"
          onClick={() => handleListClick(listName)}
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleListClick(listName);
            }
          }}
        >
          <div className={`pokedex-list-header ${getClassNameForList(listName)}`}>
            {displayNameMap[listName] || listName}
          </div>
          <div className="pokedex-pokemon-preview">
            {previewPokemon && previewPokemon.length > 0 ? (
              previewPokemon
            ) : (
              <p className="pokedex-no-pokemon-text">No Pokémon in this list</p>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="pokedex-lists-menu">
      {/* Render the "all" list spanning both columns */}
      <div className="pokedex-fullwidth-list">
        {renderListItems([fullWidthList])}
      </div>
      <div className="pokedex-columns">
        <div className="pokedex-column">
          {renderListItems(leftColumnLists)}
        </div>
        <div className="pokedex-column">
          {renderListItems(rightColumnLists)}
        </div>
      </div>
    </div>
  );
};

export default PokedexListsMenu;
