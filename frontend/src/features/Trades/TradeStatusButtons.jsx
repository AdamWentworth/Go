import React from 'react';
import './TradeStatusButtons.css';  // Reuse the same CSS file for styling

function TradeStatusButtons({ selectedStatus, setSelectedStatus }) {
  // Use objects with value and label
  const leftStatuses = [
    { value: 'Accepting', label: 'Offers' },
    { value: 'Proposed', label: 'Proposed' }
  ];
  const middleStatus = 'Pending';
  const rightStatuses = ['Completed', 'Cancelled'];

  return (
    <div className="status-buttons">
      {/* Left vertical group */}
      <div className="button-group vertical-group">
        {leftStatuses.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedStatus(value)}
            className={
              selectedStatus === value
                ? `status-button active ${value.toLowerCase()}`
                : 'status-button'
            }
          >
            {label}
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
