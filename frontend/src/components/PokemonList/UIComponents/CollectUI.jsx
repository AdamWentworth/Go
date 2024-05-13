// CollectUI.jsx
import React, { useState, useEffect } from 'react';
import './CollectUI.css';

const CollectUI = ({
  statusFilter, setStatusFilter, onFastSelectToggle,
  onSelectAll, highlightedCards, confirmMoveToFilter
}) => {
  const filters = ['Owned', 'Trade', 'Unowned', 'Wanted'];
  const [selectedFilter, setSelectedFilter] = useState("");
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);

  useEffect(() => {
    setSelectedFilter(statusFilter); // Ensure this runs correctly
    console.log("Status Filter updated in CollectUI: ", statusFilter);
  }, [statusFilter]);
  
  const handleFilterClick = (filter) => {
    if (highlightedCards.size > 0) {
      confirmMoveToFilter(filter.toLowerCase()); // Pass filter as lowercase
    } else {
      const newFilter = statusFilter === filter ? "" : filter;
      setStatusFilter(newFilter); // This should also manage 'selectedFilter' equivalently
    }
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
        className="select-all-button"
        onClick={onSelectAll}
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

