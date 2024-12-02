// HighlightActionButton.jsx

import React, { useState } from 'react';
import './HighlightActionButton.css';

function HighlightActionButton({
  highlightedCards,
  handleConfirmMoveToFilter,
  ownershipFilter,
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
        {/* Filter buttons expand above the main button */}
        {isExpanded && (
          <div className="filter-buttons">
            <button
              className="filter-button Owned"
              onClick={() => handleFilterClick('Owned')}
            >
              Owned
            </button>
            <button
              className="filter-button Trade"
              onClick={() => handleFilterClick('Trade')}
            >
              Trade
            </button>
            <button
              className="filter-button Wanted"
              onClick={() => handleFilterClick('Wanted')}
            >
              Wanted
            </button>
          </div>
        )}
        {/* Main button remains at the bottom */}
        <button className="main-button" onClick={handleMainButtonClick}>
          List ({highlightedCards.size})
        </button>
        {/* Conditionally render the Transfer button if ownershipFilter is not empty */}
        {ownershipFilter !== '' && (
          <button
            className="transfer-button"
            onClick={() => handleFilterClick('Unowned')}
          >
            Transfer ({highlightedCards.size})
          </button>
        )}
      </div>
    </div>
  );
}

export default HighlightActionButton;
