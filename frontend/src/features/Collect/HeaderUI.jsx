// HeaderUI.jsx
import React from 'react';
import SearchUI from './UIComponents/SearchUI';
import './HeaderUI.css';

const HeaderUI = ({
  searchTerm,
  setSearchTerm,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  onListsButtonClick,
  onPokedexClick,
}) => {
  return (
    <div className="header">
      <div className="pokedex-container">
        <div className="toggle-button" onClick={onPokedexClick}>
          <span className="toggle-text">POKEDEX</span>
        </div>
      </div>
        <SearchUI
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showEvolutionaryLine={showEvolutionaryLine}
          toggleEvolutionaryLine={toggleEvolutionaryLine}
        />
      <div className="lists-container">
        <div className="toggle-button" onClick={onListsButtonClick}>
          <span className="toggle-text">LISTS</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeaderUI);
