// CollectUI.jsx
import React, { useState } from 'react';
import './CollectUI.css';

const CollectUI = ({
  statusFilter, setStatusFilter,
  selectAll, onSelectAll
}) => {
  const filters = ['Unowned', 'Owned', 'Trade', 'Wanted'];
  const [selectedFilter, setSelectedFilter] = useState("");
  // Manage fastSelectEnabled state locally
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);

  const handleFilterClick = (filter) => {
    const newFilter = statusFilter === filter ? "" : filter;
    setStatusFilter(newFilter);
    setSelectedFilter(newFilter);
  };

  // Toggle fast select enabled state
  const handleToggleFastSelect = () => {
    setFastSelectEnabled(!fastSelectEnabled); // Toggle state
  };

  return (
    <div className="header-section collect-section">
      <div className="collect-header">
        <div className="collect-header-left">
          <button onClick={handleToggleFastSelect} className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}>
              <img src="/images/fast_select.png" alt="Toggle Fast Select" />
          </button>
          <button
            className="top-button"
            onClick={onSelectAll}
          >
            Select All
          </button>
        </div>
        <h1>Collect</h1>
      </div>
      <div className="status-filters">
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
