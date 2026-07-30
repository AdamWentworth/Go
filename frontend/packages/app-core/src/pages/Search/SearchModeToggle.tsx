import React from 'react';
import './SearchModeToggle.css';

export type SearchMode = 'trainer' | 'pokemon' | null;

type SearchModeToggleProps = {
  searchMode: SearchMode;
  setSearchMode: React.Dispatch<React.SetStateAction<SearchMode>>;
  isWelcome?: boolean;
};

const SearchModeToggle: React.FC<SearchModeToggleProps> = ({
  searchMode,
  setSearchMode,
  isWelcome = false,
}) => (
  <div className={`search-toggle-container ${isWelcome ? 'welcome' : ''}`}>
    <button
      className={`toggle-btn trainer-btn ${searchMode === 'trainer' ? 'active' : ''} ${isWelcome ? 'large' : ''}`}
      onClick={() => setSearchMode('trainer')}
    >
      Trainer
    </button>
    <button
      className={`toggle-btn pokemon-btn ${searchMode === 'pokemon' ? 'active' : ''} ${isWelcome ? 'large' : ''}`}
      onClick={() => setSearchMode('pokemon')}
    >
      Pokemon
    </button>
  </div>
);

export default SearchModeToggle;
