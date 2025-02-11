// PokedexFiltersMenu.jsx

import React from 'react';
import './PokedexFiltersMenu.css'; // You can reuse or modify the ListsMenu CSS if desired

const PokedexFiltersMenu = ({ onSelectFilter }) => {
  // Define the filter categories.
  const leftColumnFilters = ['Default', 'Shiny'];
  const rightColumnFilters = ['Costume', 'Shadow'];

  const renderFilterItems = (filterNames) => {
    return filterNames.map((filterName) => (
      <div
        key={filterName}
        className="list-item"
        onClick={() => onSelectFilter(filterName)}
        tabIndex="0" // For accessibility
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSelectFilter(filterName);
        }}
      >
        <div className="list-header">{filterName}</div>
      </div>
    ));
  };

  return (
    <div className="lists-menu">
      <div className="column">
        {renderFilterItems(leftColumnFilters)}
      </div>
      <div className="column">
        {renderFilterItems(rightColumnFilters)}
      </div>
    </div>
  );
};

export default PokedexFiltersMenu;
