// CollectUI.jsx
import React from 'react';
import './collectUI.css';

const CollectUI = ({
  statusFilter, setStatusFilter,
  fastSelectEnabled, toggleFastSelect,
  selectAll, onSelectAll
}) => {
  const filters = ['Unowned', 'Wanted', 'Owned', 'Trade'];

  return (
    <div className="header-section collect-section">
      <div className="collect-header">
        <div className="collect-header-left">
          <button
            className={`top-button ${fastSelectEnabled ? 'active' : ''}`}
            onClick={toggleFastSelect}
          >
            Fast Select: {fastSelectEnabled ? 'On' : 'Off'}
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
            className={`filter-button ${statusFilter === filter ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === filter ? "" : filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CollectUI;
