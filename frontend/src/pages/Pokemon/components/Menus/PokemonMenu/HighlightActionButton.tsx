// HighlightActionButton.jsx

import React, { useState } from 'react';
import './HighlightActionButton.css';

export interface HighlightActionButtonProps {
  highlightedCards: Set<string>;
  handleConfirmChangeTags: (filter: string) => void;
  tagFilter: string;
  isUpdating: boolean;
}

const HighlightActionButton: React.FC<HighlightActionButtonProps> = ({
  highlightedCards,
  handleConfirmChangeTags,
  tagFilter,
  isUpdating,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleMainButtonClick = (): void => {
    setIsExpanded(prev => !prev);
  };

  const handleFilterClick = (filter: string): void => {
    handleConfirmChangeTags(filter);
    setIsExpanded(false);
  };

  return (
    <div className="highlight-action-container">
      <div className={`action-buttons ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="filter-buttons">
            <button
              className="filter-button Owned"
              onClick={() => handleFilterClick('Owned')}
              disabled={isUpdating}
            >
              Caught
            </button>
            <button
              className="filter-button Trade"
              onClick={() => handleFilterClick('Trade')}
              disabled={isUpdating}
            >
              Trade
            </button>
            <button
              className="filter-button Wanted"
              onClick={() => handleFilterClick('Wanted')}
              disabled={isUpdating}
            >
              Wanted
            </button>
          </div>
        )}

        <button
          className="main-button"
          onClick={handleMainButtonClick}
          disabled={isUpdating}
        >
          Tag ({highlightedCards.size})
        </button>

        {tagFilter !== '' && (
          <button
            className="transfer-button"
            onClick={() => handleFilterClick('Unowned')}
            disabled={isUpdating}
          >
            Transfer ({highlightedCards.size})
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(HighlightActionButton);