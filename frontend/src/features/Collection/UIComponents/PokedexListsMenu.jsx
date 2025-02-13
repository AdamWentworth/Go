import React from 'react';
import './PokedexListsMenu.css';

const PokedexListsMenu = ({
  // For controlling the old filter actions
  setOwnershipFilter,
  setHighlightedCards,
  setIsShiny,
  setShowCostume,
  setShowShadow,
  setShowAll,
  setActiveView,
  // For building the previews
  pokedexLists,
  variants
}) => {
  // Left column vs. Right column categorization:
  const leftColumnLists = [
    'default',
    'shiny',
    'costume',
    'shadow',
    'shiny costume',
    'shiny shadow'
  ];
  
  // Include an "all" option at the end (plus the other categories).
  const rightColumnLists = [
    'shadow costume',
    'mega',
    'shiny mega',
    'dynamax',
    'shiny dynamax',
    'gigantamax',
    'shiny gigantamax',
    'all'
  ];

  // Optional: If you want nicer display names in the UI:
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
   * Handle the onClick action for each list item.
   * - For "Default", "Shiny", "Costume", "Shadow", and "All", replicate
   *   the old filter behavior from PokedexFiltersMenu.
   * - For the others, just log a placeholder message for now.
   */
  const handleListClick = (listName) => {
    if (setOwnershipFilter) {
      // Always clear the ownership filter when changing Pokedex list
      setOwnershipFilter('');
    }
    if (setHighlightedCards) {
      setHighlightedCards(new Set());
    }

    // Switch-case for the main filters
    switch (listName) {
      case 'default':
        setIsShiny?.(false);
        setShowCostume?.(false);
        setShowShadow?.(false);
        setShowAll?.(false);
        break;
      case 'shiny':
        setIsShiny?.(true);
        setShowCostume?.(false);
        setShowShadow?.(false);
        setShowAll?.(false);
        break;
      case 'costume':
        setIsShiny?.(false);
        setShowCostume?.(true);
        setShowShadow?.(false);
        setShowAll?.(false);
        break;
      case 'shadow':
        setIsShiny?.(false);
        setShowCostume?.(false);
        setShowShadow?.(true);
        setShowAll?.(false);
        break;
      case 'all':
        setIsShiny?.(false);
        setShowCostume?.(false);
        setShowShadow?.(false);
        setShowAll?.(true);
        break;
      default:
        // For now, do nothing or log a placeholder
        console.log(`No custom filter actions yet for '${listName}'`);
        break;
    }
    // Slide back to the Pokémon List panel
    setActiveView?.('pokemonList');
  };

  /**
   * Renders the preview images for a given list name.
   */
  const renderListPreview = (listName) => {
    let listData;

    if (listName === 'all') {
      // Show *all* variants for "All" list
      listData = variants;
    } else {
      // Grab the array from pokedexLists (or empty array if missing)
      listData = pokedexLists[listName] || [];
    }

    // Slice the first 24 to make a grid preview
    return listData.slice(0, 24).map((pokemon, index) => {
      if (!pokemon || !pokemon.currentImage) {
        return null;
      }
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
        <div key={pokemon.id || index} className="pokemon-list-container">
          <img
            src={pokemon.currentImage}
            alt={pokemon.name || 'Unknown Pokémon'}
            className="preview-image"
          />
          {overlaySrc && (
            <img
              src={overlaySrc}
              alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
              className="variant-overlay"
              aria-hidden="true"
            />
          )}
        </div>
      );
    });
  };

  /**
   * Renders the menu items in a column (similar to OwnershipListsMenu).
   */
  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      // Build the preview
      const previewPokemon = renderListPreview(listName);

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => handleListClick(listName)}
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleListClick(listName);
            }
          }}
        >
          <div className="list-header">
            {displayNameMap[listName] || listName}
          </div>
          <div className="pokemon-preview">
            {previewPokemon && previewPokemon.length > 0 ? (
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
    <div className="lists-menu pokedex-lists-menu">
      <div className="column">
        {renderListItems(leftColumnLists)}
      </div>
      <div className="column">
        {renderListItems(rightColumnLists)}
      </div>
    </div>
  );
};

export default PokedexListsMenu;
