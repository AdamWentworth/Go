// SearchModeToggle.jsx

import React from 'react';
import './SearchModeToggle.css';

const SearchModeToggle = ({ searchMode, setSearchMode, isWelcome = false }) => {
  return (
    <div className={`search-toggle-container ${isWelcome ? 'welcome' : ''}`}>
      <button
        className={`toggle-btn friends-btn ${searchMode === 'friends' ? 'active' : ''} ${isWelcome ? 'large' : ''}`}
        onClick={() => setSearchMode('friends')}
      >
        Friends
      </button>
      <button
        className={`toggle-btn pokemon-btn ${searchMode === 'pokemon' ? 'active' : ''} ${isWelcome ? 'large' : ''}`}
        onClick={() => setSearchMode('pokemon')}
      >
        Pokémon
      </button>
    </div>
  );
};

export default SearchModeToggle;
