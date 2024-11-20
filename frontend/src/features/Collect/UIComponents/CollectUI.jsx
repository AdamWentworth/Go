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
    <div className="header-section collect-section">
      <div className="collect-header"></div>
      <div className={`button-container ${isEditable ? 'editable' : 'non-editable'}`}>
        {/* Context Text */}
        <div
          className={`context-text-container ${isEditable ? 'editing' : 'viewing'} ${
            !ownershipFilter ? 'viewing-all' : ''
          }`}
        >
          <p className="context-text">{contextText}</p>
        </div>
        {/* Buttons */}
        {isEditable && (
          <>
            <button
              className={`select-all-button ${selectAllEnabled ? 'active' : ''}`}
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              onClick={handleToggleFastSelect}
              className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}
            >
              <img src="/images/fast_select.png" alt="Toggle Fast Select" />
            </button>
          </>
        )}
        <button className="lists-button" onClick={onListsButtonClick}>
          Lists
        </button>
      </div>
    </div>
  );
};

export default CollectUI;