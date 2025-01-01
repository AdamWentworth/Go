// HighlightActionButton.jsx

import React, { useState } from 'react';
import './HighlightActionButton.css';

function HighlightActionButton({
  highlightedCards,
  handleConfirmMoveToFilter,
  ownershipFilter,
  isUpdating, // Add this prop
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainButtonClick = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleFilterClick = (filter) => {
    handleConfirmMoveToFilter(filter);
    setIsExpanded(false); // Collapse after action
  };

  return (
    <div className="highlight-action-container">
      <div className={`action-buttons ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="filter-buttons">
            <button
              className="filter-button Owned"
              onClick={() => handleFilterClick('Owned')}
              disabled={isUpdating} // Disable during updates
            >
              Owned
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
          List ({highlightedCards.size})
        </button>
        {ownershipFilter !== '' && (
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
}

export default HighlightActionButton;
