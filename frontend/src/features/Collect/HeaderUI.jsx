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
}) => {
  const width = useWindowWidth();
  const isWideScreen = width >= 1024;
  const attachPokedexClick = !React.isValidElement(contextText);
  const headerClassNames = [
    'header',
    isWideScreen ? 'header-widescreen' : 'header-narrow',
  ];

  return (
    <header className={headerClassNames.join(' ')}>
      {isWideScreen ? (
        // Widescreen layout: Pokémon count will be rendered in SearchUI.
        <>
          <div className="pokedex-container">
            <div
              className="toggle-button"
              onClick={attachPokedexClick ? onPokedexClick : undefined}
            >
              <span className="toggle-text">
                {React.isValidElement(contextText) ? contextText : 'POKEDEX'}
              </span>
            </div>
          </div>
          <SearchUI
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showEvolutionaryLine={showEvolutionaryLine}
            toggleEvolutionaryLine={toggleEvolutionaryLine}
            totalPokemon={totalPokemon}
            showCount={true} // show the count in widescreen
          />
          <div className="lists-container">
            <div className="toggle-button" onClick={onListsButtonClick}>
              <span className="toggle-text">LISTS</span>
            </div>
          </div>
        </>
      ) : (
        // Mobile / narrow layout: Pokémon count rendered in the controls row.
        <>
          <div className="controls-row">
            <div className="pokedex-container">
              <div
                className="toggle-button"
                onClick={attachPokedexClick ? onPokedexClick : undefined}
              >
                <span className="toggle-text">
                  {React.isValidElement(contextText) ? contextText : 'POKEDEX'}
                </span>
              </div>
            </div>
            <div className="pokemon-count-narrow">
              <span>Pokémon</span>
              <span>({totalPokemon})</span>
            </div>
            <div className="lists-container">
              <div className="toggle-button" onClick={onListsButtonClick}>
                <span className="toggle-text">LISTS</span>
              </div>
            </div>
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
