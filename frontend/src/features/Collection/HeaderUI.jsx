// HeaderUI.jsx
import React from 'react';
import SearchUI from './UIComponents/SearchUI';
import useWindowWidth from './hooks/useWindowWidth';
import './HeaderUI.css';

const HeaderUI = ({
  searchTerm,
  setSearchTerm,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  onListsButtonClick,
  onPokedexClick,
  contextText,
  totalPokemon,
  // New props for fast select
  highlightedCards,
  onClearSelection,
  onSelectAll,
}) => {
  const width = useWindowWidth();
  const isWideScreen = width >= 1024;
  const attachPokedexClick = !React.isValidElement(contextText);

  // Determine if we are in fast-select mode (i.e. some cards are highlighted)
  const hasSelection = highlightedCards && highlightedCards.size > 0;

  // Add a class when fast-select is active
  const headerClassNames = [
    'header',
    isWideScreen ? 'header-widescreen' : 'header-narrow',
    hasSelection ? 'header-fast-select' : ''
  ];

  // Render the left toggle (Pokedex/X)
  const renderPokedexToggle = () => {
    const isCustomContext = React.isValidElement(contextText);
    const toggleButtonClassName = isCustomContext ? "toggle-button custom-context-button" : "toggle-button";
    const toggleTextClassName = isCustomContext ? "toggle-text custom-context" : "toggle-text";
  
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onClearSelection}>
          <span className="free-toggle-text">X</span>
        </div>
      );
    }
    return (
      <div
        className={toggleButtonClassName}
        onClick={attachPokedexClick ? onPokedexClick : undefined}
      >
        <span className={toggleTextClassName}>
          {isCustomContext ? contextText : 'POKÉDEX'}
        </span>
      </div>
    );
  };
  
  // Render the right toggle (Listings/Select All)
  const renderListsToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onSelectAll}>
          <span className="free-toggle-text">SELECT ALL</span>
        </div>
      );
    }
    return (
      <div className="toggle-button" onClick={onListsButtonClick}>
        <span className="toggle-text">MY POKÉMON</span>
      </div>
    );
  };

  // Common containers for both widescreen and mobile
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
          <SearchUI
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showEvolutionaryLine={showEvolutionaryLine}
            toggleEvolutionaryLine={toggleEvolutionaryLine}
            totalPokemon={totalPokemon}
            showCount={true} // show the count in widescreen
          />
          {listsContainer}
        </>
      ) : (
        <>
          <div className="controls-row">
            {pokedexContainer}
            <div className="pokemon-count-narrow">
              <span>Pokémon</span>
              <span>({totalPokemon})</span>
            </div>
            {listsContainer}
          </div>
          <SearchUI
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showEvolutionaryLine={showEvolutionaryLine}
            toggleEvolutionaryLine={toggleEvolutionaryLine}
            totalPokemon={totalPokemon}
            showCount={false} // do not show the count in SearchUI for mobile
          />
        </>
      )}
    </header>
  );
};

export default React.memo(HeaderUI);