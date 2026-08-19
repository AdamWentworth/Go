import React from 'react';
import { FaSearch, FaUserFriends } from 'react-icons/fa';
import './SearchModeToggle.css';

export type SearchMode = 'pokemon' | 'trainer';

type SearchModeToggleProps = {
  searchMode: SearchMode;
  setSearchMode: React.Dispatch<React.SetStateAction<SearchMode>>;
};

const SearchModeToggle: React.FC<SearchModeToggleProps> = ({
  searchMode,
  setSearchMode,
}) => (
  <div
    className="search-toggle-container"
    aria-label="Search category"
    role="tablist"
  >
    <button
      aria-controls="search-panel-pokemon"
      aria-selected={searchMode === 'pokemon'}
      className={`toggle-btn ${searchMode === 'pokemon' ? 'active' : ''}`}
      id="search-tab-pokemon"
      onClick={() => setSearchMode('pokemon')}
      role="tab"
      type="button"
    >
      <FaSearch aria-hidden="true" />
      <span>Pokémon</span>
    </button>
    <button
      aria-controls="search-panel-trainer"
      aria-selected={searchMode === 'trainer'}
      className={`toggle-btn ${searchMode === 'trainer' ? 'active' : ''}`}
      id="search-tab-trainer"
      onClick={() => setSearchMode('trainer')}
      role="tab"
      type="button"
    >
      <FaUserFriends aria-hidden="true" />
      <span>Trainers</span>
    </button>
  </div>
);

export default SearchModeToggle;
