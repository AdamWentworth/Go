import React from 'react';
import useWindowWidth from '../hooks/useWindowWidth';
import './PokedexListsMenu.css';

const PokedexListsMenu = ({
  // Still available if needed: setOwnershipFilter, setHighlightedCards, setActiveView
  setOwnershipFilter,
  setHighlightedCards,
  setActiveView,
  // For building the previews
  pokedexLists,
  variants,
  onListSelect,
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

  // "All" will be rendered as a full-width list in two-column mode, 
  // but in one-column mode it will be the first in our ordering.
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

    // Return the list data when clicked.
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

  // New helper function to render icons for shiny, shadow, costume, mega, dynamax, and gigantamax.
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
    return icons;
  };

  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      const previewPokemon = renderListPreview(listName);
      const icons = renderHeaderIcons(listName);

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
                {displayNameMap[listName] || listName}
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

  // Use a hook to get window width
  const width = useWindowWidth();
  const isOneColumn = width < 650;

  if (isOneColumn) {
    // Build a single array that starts with "all" then alternates between left and right
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
    const oneColumnOrder = [fullWidthList, ...alternateLists];

    return (
      <div className="pokedex-lists-menu one-column">
        {renderListItems(oneColumnOrder)}
      </div>
    );
  } else {
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
  }
};

export default PokedexListsMenu;
