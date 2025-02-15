// PokedexListsMenu.jsx
import React, { useRef } from 'react';
import useWindowWidth from '../hooks/useWindowWidth';
import './PokedexListsMenu.css';

const PokedexListsMenu = ({
  setOwnershipFilter,
  setHighlightedCards,
  setActiveView,
  pokedexLists,
  variants,
  onListSelect,
  onSwipe  // New prop for swipe handling
}) => {
  // Original arrays for two-column layout
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
  const fullWidthList = 'all';
  const displayNameMap = {
    default: 'Default',
    shiny: 'Shiny',
    costume: 'Costume',
    shadow: 'Shadow',
    'shiny costume': 'Shiny Costume',
    'shiny shadow': 'Shiny Shadow',
    'shadow costume': 'Shadow Costume',
    mega: 'Mega',
    'shiny mega': 'Shiny Mega',
    dynamax: 'Dynamax',
    'shiny dynamax': 'Shiny Dynamax',
    gigantamax: 'Gigantamax',
    'shiny gigantamax': 'Shiny Gigantamax',
    all: 'All'
  };

  const getClassNameForList = (listName) => listName.replace(/\s+/g, '-').toLowerCase();

  const handleListClick = (listName) => {
    setOwnershipFilter?.('');
    setHighlightedCards?.(new Set());
    if (onListSelect) {
      if (listName === 'all') {
        onListSelect(variants);
      } else {
        onListSelect(pokedexLists[listName] || []);
      }
    }
    setActiveView?.('pokemonList');
  };

  // Swipe handling for the Pokedex menu (only allow right swipe)
  const SWIPE_THRESHOLD = 50;
  const touchStartX = useRef(0);
  const lastTouchX = useRef(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    lastTouchX.current = touch.clientX;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    lastTouchX.current = touch.clientX;
  };

  const handleTouchEnd = () => {
    const dx = lastTouchX.current - touchStartX.current;
  
    // Swipe to the right:
    if (dx > SWIPE_THRESHOLD) {
      onSwipe && onSwipe('right');
    }
    // Swipe to the left:
    else if (dx < -SWIPE_THRESHOLD) {
      onSwipe && onSwipe('left');
    }
  };

  const renderListPreview = (listName) => {
    let listData = listName === 'all' ? variants : (pokedexLists[listName] || []);
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
      const icons = []; // For simplicity, use your existing renderHeaderIcons logic here if needed

      return (
        <div
          key={listName}
          className="pokedex-list-item"
          onClick={() => handleListClick(listName)}
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleListClick(listName);
          }}
        >
          <div className={`pokedex-list-header ${getClassNameForList(listName)}`}>
            {displayNameMap[listName] || listName}
          </div>
          <div className="pokedex-pokemon-preview">
            {previewPokemon && previewPokemon.length > 0 ? previewPokemon : <p className="pokedex-no-pokemon-text">No Pokémon in this list</p>}
          </div>
        </div>
      );
    });
  };

  // Use a hook to get window width (existing code)
  const width = useWindowWidth();
  const isOneColumn = width < 650;

  // Attach touch handlers to the root container
  return isOneColumn ? (
    <div
      className="pokedex-lists-menu one-column"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {renderListItems([fullWidthList, ...[...leftColumnLists, ...rightColumnLists]])}
    </div>
  ) : (
    <div
      className="pokedex-lists-menu"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
