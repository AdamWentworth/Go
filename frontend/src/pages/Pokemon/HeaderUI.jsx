// HeaderUI.jsx
import React from 'react';
import useWindowWidth from './hooks/useWindowWidth';
import './HeaderUI.css';

const HeaderUI = ({
  onListsButtonClick,
  onPokedexClick,
  contextText,
  totalPokemon,
  highlightedCards,
  onClearSelection,
  onSelectAll,
}) => {
  const width = useWindowWidth();
  const isWideScreen = width >= 1024;

  // Determine if we are in fast-select mode (i.e. some cards are highlighted)
  const hasSelection = highlightedCards && highlightedCards.size > 0;

  // Decide if clicking on the Pokedex side should do anything (custom context)
  const isCustomContext = React.isValidElement(contextText);
  const attachPokedexClick = !isCustomContext;

  // Header classes when fast-select is active
  const headerClassNames = [
    'header',
    isWideScreen ? 'header-widescreen' : 'header-narrow',
    hasSelection ? 'header-fast-select' : ''
  ];

  // Left toggle (Pokedex/X)
  const renderPokedexToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onClearSelection}>
          <span className="free-toggle-text">X</span>
        </div>
      );
    }
    const toggleButtonClass = isCustomContext
      ? 'toggle-button custom-context-button'
      : 'toggle-button';
    const toggleTextClass = isCustomContext
      ? 'toggle-text custom-context'
      : 'toggle-text';

    return (
      <div
        className={toggleButtonClass}
        onClick={attachPokedexClick ? onPokedexClick : undefined}
      >
        <span className={toggleTextClass}>
          {isCustomContext ? contextText : 'POKÉDEX'}
        </span>
      </div>
    );
  };

  // Right toggle (Tags/Select All)
  const renderListsToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onSelectAll}>
          <span className="free-toggle-text">SELECT ALL</span>
        </div>
      );
    }
    const toggleTextClass = isCustomContext
      ? 'toggle-text toggle-text--theirs'
      : 'toggle-text';
    return (
      <div className="toggle-button" onClick={onListsButtonClick}>
        <span className={toggleTextClass}>TAGS</span>
      </div>
    );
  };

  // Containers for left/right toggles
  const pokedexContainer = (
    <div className="pokedex-container">
      {renderPokedexToggle()}
    </div>
  );
  const listsContainer = (
    <div className="lists-container">
      {renderListsToggle()}
    </div>
  );

  return (
    <header className={headerClassNames.join(' ')}>
      {isWideScreen ? (
        <>
          {pokedexContainer}
          {/* Middle count for wide screens */}
          <div className="pokemon-count-wide">
            <span>Pokémon</span>
            <span>({totalPokemon})</span>
          </div>
          {listsContainer}
        </>
      ) : (
        <div className="controls-row">
          {pokedexContainer}
          {/* Narrow screens: existing layout */}
          <div className="pokemon-count-narrow">
            <span>Pokémon</span>
            <span>({totalPokemon})</span>
          </div>
          {listsContainer}
        </div>
      )}
    </header>
  );
};

export default React.memo(HeaderUI);