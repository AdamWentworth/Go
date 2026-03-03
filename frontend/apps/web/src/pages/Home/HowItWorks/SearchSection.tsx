// SearchSection.jsx
import React from 'react';
import './SearchSection.css';

const SearchSection = () => {
  return (
    <div className="search-section">
      {/* Top row with Search button */}
      <div className="row top-row">
        <div className="search-button">
          <img src="/images/btn_search.png" alt="Search Button" />
        </div>
      </div>

      {/* Section title */}
      <div className="row section-header">
        <h2>Search</h2>
      </div>

      {/* Additional content */}
      <div className="row">
        {/* Add your search input, button, or additional functionality here */}
      </div>
    </div>
  );
};

export default SearchSection;
