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
  onSwipe // New prop for swipe handling
}) => {
  // Define list order for two-column mode
  const leftColumnLists = [
    'default',
    'costume',
    'shadow',
    'mega',
    'dynamax',
    'gigantamax',
    'fusion',
    'shadow costume',
  ];
  const rightColumnLists = [
    'shiny',
    'shiny costume',
    'shiny shadow',
    'shiny mega',
    'shiny dynamax',
    'shiny gigantamax',
    'shiny fusion',
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
    fusion: 'Fusion',
    'shiny fusion': 'Shiny Fusion',
    all: 'All'
  };

  // Helper: convert list name to a CSS-friendly class name
  const getClassNameForList = (listName) =>
    listName.replace(/\s+/g, '-').toLowerCase();

  // When a list is clicked, clear filters/highlights and pass back the data
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

  // --- Swipe Handling ---
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
    if (dx > SWIPE_THRESHOLD) {
      onSwipe && onSwipe('right');
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipe && onSwipe('left');
    }
  };

  // --- Header Icons ---
  const renderHeaderIcons = (listName) => {
    const icons = [];
    const lower = listName.toLowerCase();
    if (lower.includes('shiny')) {
      icons.push(
        <img
          key="shiny"
          src={`${process.env.PUBLIC_URL}/images/shiny_icon.png`}
          alt="Shiny"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('shadow')) {
      icons.push(
        <img
          key="shadow"
          src={`${process.env.PUBLIC_URL}/images/shadow_icon.png`}
          alt="Shadow"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('costume')) {
      icons.push(
        <img
          key="costume"
          src={`${process.env.PUBLIC_URL}/images/costume_icon.png`}
          alt="Costume"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('mega')) {
      icons.push(
        <img
          key="mega"
          src={`${process.env.PUBLIC_URL}/images/mega.png`}
          alt="Mega"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('dynamax')) {
      icons.push(
        <img
          key="dynamax"
          src={`${process.env.PUBLIC_URL}/images/dynamax-icon.png`}
          alt="Dynamax"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('gigantamax')) {
      icons.push(
        <img
          key="gigantamax"
          src={`${process.env.PUBLIC_URL}/images/gigantamax-icon.png`}
          alt="Gigantamax"
          className="list-header-icon"
        />
      );
    }
    if (lower.includes('fusion')) {
      icons.push(
        <img
          key="fusion1"
          src={`${process.env.PUBLIC_URL}/images/fusion_1.png`}
          alt="Fusion1"
          className="list-header-icon"
        />,
        <img
          key="fusion2"
          src={`${process.env.PUBLIC_URL}/images/fusion_2.png`}
          alt="Fusion2"
          className="list-header-icon"
        />
      );
    }
    return icons;
  };

  // --- Render Pokémon Preview ---
  const renderListPreview = (listName) => {
    const listData = listName === 'all' ? variants : (pokedexLists[listName] || []);
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

  // --- Render List Items ---
  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      const previewPokemon = renderListPreview(listName);
      // Special handling for "shiny fusion"
      if (listName.toLowerCase() === 'shiny fusion') {
        const icons = renderHeaderIcons(listName);
        // Expected: icons[0] is the Shiny icon,
        // icons[1] and icons[2] are the fusion icons.
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
            <div className={`pokedex-list-header ${getClassNameForList(listName)} fusion-header`}>
              <span className="list-header-icon left">{icons[0]}</span>
              <span className="list-header-text">
                {displayNameMap[listName] || listName}
              </span>
              <span className="fusion-icons">
                {icons[1]}
                {icons[2]}
              </span>
            </div>
            <div className="pokedex-pokemon-preview">
              {renderListPreview(listName).length > 0 ? (
                renderListPreview(listName)
              ) : (
                <p className="pokedex-no-pokemon-text">No Pokémon in this list</p>
              )}
            </div>
          </div>
        );
      }

      // Default rendering for other list types
      const icons = renderHeaderIcons(listName);
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
            {icons.length === 2 ? (
              <>
                <span className="list-header-icon left">{icons[0]}</span>
                <span className="list-header-text">
                  {displayNameMap[listName] || listName}
                </span>
                <span className="list-header-icon right">{icons[1]}</span>
              </>
            ) : (
              <>
                {icons.length > 0 && (
                  <div className="list-header-icons">
                    {icons}
                  </div>
                )}
                <span className="list-header-text">{displayNameMap[listName] || listName}</span>
              </>
            )}
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

  // --- Responsive Layout ---
  const width = useWindowWidth();
  const isOneColumn = width < 650;

  if (isOneColumn) {
    // Alternate ordering: interleave left and right column lists
    const alternateLists = [];
    const maxLen = Math.max(leftColumnLists.length, rightColumnLists.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < leftColumnLists.length) {
        alternateLists.push(leftColumnLists[i]);
      }
      if (i < rightColumnLists.length) {
        alternateLists.push(rightColumnLists[i]);
      }
    }
    // Prepend the "all" list so it appears first
    const oneColumnOrder = [fullWidthList, ...alternateLists];
    return (
      <div
        className="pokedex-lists-menu one-column"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {renderListItems(oneColumnOrder)}
      </div>
    );
  } else {
    // Two-column view: render the "all" list at the top and then left/right columns
    return (
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
  }
};

export default PokedexListsMenu;
