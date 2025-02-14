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

  const headerClassNames = [
    'header',
    isWideScreen ? 'header-widescreen' : 'header-narrow',
  ];

  // For widescreen layout: if there is a selection, replace the POKEDEX text with an "X"
  const widescreenPokedex = (
    <div className="pokedex-container">
      <div
        className="toggle-button"
        onClick={hasSelection ? onClearSelection : (attachPokedexClick ? onPokedexClick : undefined)}
      >
        <span className="toggle-text">
          {hasSelection ? 'X' : (React.isValidElement(contextText) ? contextText : 'POKEDEX')}
        </span>
      </div>
    </div>
  );

  const widescreenLists = (
    <div className="lists-container">
      <div
        className="toggle-button"
        onClick={hasSelection ? onSelectAll : onListsButtonClick}
      >
        <span className="toggle-text">
          {hasSelection ? 'SELECT ALL' : 'LISTINGS'}
        </span>
      </div>
    </div>
  );

  // For mobile layout, use similar logic.
  const mobilePokedex = (
    <div className="pokedex-container">
      <div
        className="toggle-button"
        onClick={hasSelection ? onClearSelection : (attachPokedexClick ? onPokedexClick : undefined)}
      >
        <span className="toggle-text">
          {hasSelection ? 'X' : (React.isValidElement(contextText) ? contextText : 'POKEDEX')}
        </span>
      </div>
    </div>
  );

  const mobileLists = (
    <div className="lists-container">
      <div
        className="toggle-button"
        onClick={hasSelection ? onSelectAll : onListsButtonClick}
      >
        <span className="toggle-text">
          {hasSelection ? 'SELECT ALL' : 'LISTINGS'}
        </span>
      </div>
    </div>
  );

  return (
    <header className={headerClassNames.join(' ')}>
      {isWideScreen ? (
        // Widescreen layout: Pokémon count will be rendered in SearchUI.
        <>
          {widescreenPokedex}
          <SearchUI
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showEvolutionaryLine={showEvolutionaryLine}
            toggleEvolutionaryLine={toggleEvolutionaryLine}
            totalPokemon={totalPokemon}
            showCount={true} // show the count in widescreen
          />
          {widescreenLists}
        </>
      ) : (
        // Mobile / narrow layout: Pokémon count rendered in the controls row.
        <>
          <div className="controls-row">
            {mobilePokedex}
            <div className="pokemon-count-narrow">
              <span>Pokémon</span>
              <span>({totalPokemon})</span>
            </div>
            {mobileLists}
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
