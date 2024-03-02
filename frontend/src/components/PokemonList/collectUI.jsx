// collectUI.jsx
import React from 'react';
import './collectUI.css'; // Assuming you will create a corresponding CSS file for styles

const CollectUI = ({ statusFilter, setStatusFilter }) => {
  const filters = ['Unowned', 'Wanted', 'Owned', 'Trade'];

  return (
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
  );
};

export default CollectUI;
