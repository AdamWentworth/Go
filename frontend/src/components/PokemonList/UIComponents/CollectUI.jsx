// CollectUI.jsx
import React, { useState } from 'react';
import './CollectUI.css';

const CollectUI = ({
  statusFilter, setStatusFilter,
  selectAll, onSelectAll
}) => {
  const filters = ['Owned', 'Trade', 'Unowned', 'Wanted'];
  const [selectedFilter, setSelectedFilter] = useState("");
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);

  const handleFilterClick = (filter) => {
    const newFilter = statusFilter === filter ? "" : filter;
    setStatusFilter(newFilter);
    setSelectedFilter(newFilter);
  };

  const handleToggleFastSelect = () => {
    setFastSelectEnabled(!fastSelectEnabled);
  };

  return (
    <div className="header-section collect-section">
      <div className="collect-header">
      </div>
      <div className="button-container">
        <button
          className="top-button"
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

