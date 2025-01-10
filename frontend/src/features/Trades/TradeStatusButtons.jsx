// TradeStatusButtons.jsx

import React from 'react';
import './TradeStatusButtons.css';  // Reuse the same CSS file for styling

function TradeStatusButtons({ selectedStatus, setSelectedStatus }) {
  const leftStatuses = ['Accepting', 'Proposed'];
  const middleStatus = 'Pending';
  const rightStatuses = ['Completed', 'Cancelled'];

  return (
    <div className="status-buttons">
      {/* Left vertical group */}
      <div className="button-group vertical-group">
        {leftStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={
              selectedStatus === status
                ? `status-button active ${status.toLowerCase()}`
                : 'status-button'
            }
          >
            {status}
          </button>
        ))}
      </div>

      {/* Middle single button group */}
      <div className="button-group middle-group">
        <button
          key={middleStatus}
          onClick={() => setSelectedStatus(middleStatus)}
          className={
            selectedStatus === middleStatus
              ? `status-button active ${middleStatus.toLowerCase()}`
              : 'status-button'
          }
        >
          {middleStatus}
        </button>
      </div>

      {/* Right vertical group */}
      <div className="button-group vertical-group right-group">
        {rightStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={
              selectedStatus === status
                ? `status-button active ${status.toLowerCase()}`
                : 'status-button'
            }
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TradeStatusButtons;
