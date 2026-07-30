import type { TradeStatusFilter } from './types';

import './TradeStatusButtons.css';

interface TradeStatusButtonsProps {
  selectedStatus: TradeStatusFilter;
  setSelectedStatus: (status: TradeStatusFilter) => void;
}

const leftStatuses: ReadonlyArray<{ value: TradeStatusFilter; label: string }> = [
  { value: 'Accepting', label: 'Offers' },
  { value: 'Proposed', label: 'Proposed' },
];

const middleStatus: TradeStatusFilter = 'Pending';
const rightStatuses: ReadonlyArray<TradeStatusFilter> = ['Completed', 'Cancelled'];

function TradeStatusButtons({
  selectedStatus,
  setSelectedStatus,
}: TradeStatusButtonsProps) {
  return (
    <div className="status-buttons">
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
