// PokedexFiltersMenu.jsx

import React from 'react';
import './PokedexFiltersMenu.css';

const PokedexFiltersMenu = ({
  setOwnershipFilter,
  setHighlightedCards,
  setIsShiny,
  setShowCostume,
  setShowShadow,
  setShowAll,
  setActiveView,
}) => {
  // Add the new filter "All" into one of the columns (here, leftColumnFilters)
  const leftColumnFilters = ['Default', 'Shiny', 'All'];
  const rightColumnFilters = ['Costume', 'Shadow'];

  // New handler moved from Collect.jsx:
  const handleFilterSelect = (filter) => {
    // Always clear the ownership filter when a Pokédex option is chosen.
    setOwnershipFilter('');
    // Clear any highlighted cards.
    setHighlightedCards(new Set());

    // Update filter states based on the selected filter.
    switch (filter) {
      case 'Default':
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Shiny':
        setIsShiny(true);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Costume':
        setIsShiny(false);
        setShowCostume(true);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Shadow':
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(true);
        setShowAll(false);
        break;
      case 'All':
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(true);
        break;
      default:
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
    }
    // Slide back to the Pokémon List panel.
    setActiveView("pokemonList");
  };

  const renderFilterItems = (filterNames) => {
    return filterNames.map((filterName) => (
      <div
        key={filterName}
        className="list-item"
        onClick={() => handleFilterSelect(filterName)}
        tabIndex="0" // For accessibility
        onKeyPress={(e) => {
          if (e.key === 'Enter') handleFilterSelect(filterName);
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
