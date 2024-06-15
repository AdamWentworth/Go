// CollectUI.jsx
import React, { useState, useEffect } from 'react';
import './CollectUI.css';

// Utility function to preload images
const preloadImage = (url) => {
  const img = new Image();
  img.src = url;
};

const CollectUI = ({
  statusFilter, setStatusFilter, onFastSelectToggle,
  onSelectAll, highlightedCards, confirmMoveToFilter, showAll, toggleShowAll
}) => {
  const filters = ['Owned', 'Trade', 'Unowned', 'Wanted'];
  const [selectedFilter, setSelectedFilter] = useState("");
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);
  const [SelectAllEnabled, setSelectAllEnabled] = useState(false);

  useEffect(() => {
    setSelectedFilter(statusFilter); // Ensure this runs correctly
    console.log("Status Filter updated in CollectUI: ", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    // Preload fast select icon
    preloadImage("/images/fast_select.png");
    // Preload other images if necessary
    // Add preloads for dynamically determined images if they depend on statusFilter
  }, []);
  
  const handleFilterClick = (filter) => {
    if (highlightedCards.size > 0) {
      confirmMoveToFilter(filter); // Pass filter as lowercase
    } else {
      const newFilter = statusFilter === filter ? "" : filter; // Toggle filter on or off
      setStatusFilter(newFilter); // Update the filter state

      // Update `showAll` state based on the filter toggling
      if (newFilter === "") {
        // If no filter is active, set `showAll` to false
        toggleShowAll(false);
      } else if (!showAll && statusFilter !== filter) {
        // If a new filter is being activated and `showAll` is currently false, set it to true
        toggleShowAll(true);
      }
    }
  setSelectAllEnabled(false);
};

  const handleSelectAll = () => {
    const newSelectAllState = !SelectAllEnabled;
    setSelectAllEnabled(newSelectAllState);
    onSelectAll(newSelectAllState); // Notify parent component
  };

  const handleToggleFastSelect = () => {
    const newFastSelectState = !fastSelectEnabled;
    setFastSelectEnabled(newFastSelectState);
    onFastSelectToggle(newFastSelectState); // Notify parent component
  };

  return (
    <div className="header-section collect-section">
      <div className="collect-header">
      </div>
      <div className="button-container">
      <button
        className={`select-all-button ${SelectAllEnabled ? 'active' : ''}`}
        onClick={handleSelectAll}
      >
        Select All
      </button>
        <button onClick={handleToggleFastSelect} className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}>
          <img src="/images/fast_select.png" alt="Toggle Fast Select" />
        </button>
        {filters.map((filter) => (
          <button
            key={filter}
            className={`filter-button ${filter} ${selectedFilter === filter ? 'active' : ''} ${selectedFilter !== "" && selectedFilter !== filter ? 'non-selected' : ''}`}
            onClick={() => handleFilterClick(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CollectUI;

