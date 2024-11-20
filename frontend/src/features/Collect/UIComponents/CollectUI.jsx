// CollectUI.jsx

import React, { useState } from 'react';
import './CollectUI.css';

const CollectUI = ({
  isEditable,
  onFastSelectToggle,
  onSelectAll,
  highlightedCards,
  confirmMoveToFilter,
  showAll,
  toggleShowAll,
  isShiny,
  showCostume,
  showShadow,
  contextText,
  onListsButtonClick,
  ownershipFilter,
  isWide,
}) => {
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);
  const [selectAllEnabled, setSelectAllEnabled] = useState(false);

  const handleSelectAll = () => {
    const newSelectAllState = !selectAllEnabled;
    setSelectAllEnabled(newSelectAllState);
    onSelectAll(newSelectAllState);
  };

  const handleToggleFastSelect = () => {
    const newFastSelectState = !fastSelectEnabled;
    setFastSelectEnabled(newFastSelectState);
    onFastSelectToggle(newFastSelectState);
  };

  return (
    <div className={`collect-ui ${!isWide && isEditable ? 'collect-overlay' : ''}`}>
      <div className={`button-container ${isEditable ? 'editable' : 'non-editable'}`}>
        {isEditable ? (
          <>
            {/* Context Text */}
            <div
              className={`context-text-container editing ${
                !ownershipFilter ? 'viewing-all' : ''
              }`}
            >
              <p className="context-text">{contextText}</p>
            </div>
            {/* Buttons */}
            <button
              onClick={handleToggleFastSelect}
              className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}
            >
              <img src="/images/fast_select.png" alt="Toggle Fast Select" />
            </button>
            <button
              className={`select-all-button ${selectAllEnabled ? 'active' : ''}`}
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button className="lists-button" onClick={onListsButtonClick}>
              Lists
            </button>
          </>
        ) : (
          // Render context-text and lists button side by side in all cases when isEditable is false
          <div className="non-editable-collect">
            <p className="context-text">{contextText}</p>
            <button className="lists-button" onClick={onListsButtonClick}>
              Lists
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectUI;
