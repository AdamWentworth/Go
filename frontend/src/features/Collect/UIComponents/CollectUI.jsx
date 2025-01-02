// CollectUI.jsx

import React, { useState, useEffect } from 'react';
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
  onClearOwnershipFilter,
  isWide,
}) => {
  const [fastSelectEnabled, setFastSelectEnabled] = useState(false);
  const [selectAllEnabled, setSelectAllEnabled] = useState(false);

  useEffect(() => {
    if (!isEditable) {
      if (fastSelectEnabled) {
        setFastSelectEnabled(false);
        onFastSelectToggle(false);
      }
      if (selectAllEnabled) {
        setSelectAllEnabled(false);
        onSelectAll(false);
      }
    }
  }, [isEditable, fastSelectEnabled, selectAllEnabled, onFastSelectToggle, onSelectAll]);

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

  // Determine the text and class for the Lists button based on ownershipFilter
  let listsButtonText = 'Lists';
  let listsButtonClass = '';

  if (ownershipFilter === 'Owned') {
    listsButtonText = 'Owned';
    listsButtonClass = 'owned';
  } else if (ownershipFilter === 'Trade') {
    listsButtonText = 'Trade';
    listsButtonClass = 'trade';
  } else if (ownershipFilter === 'Wanted') {
    listsButtonText = 'Wanted';
    listsButtonClass = 'wanted';
  } else if (ownershipFilter === 'Unowned') {
    listsButtonText = 'Unowned';
    listsButtonClass = 'unowned';
  }

  return (
    <div className={`collect-ui ${!isWide && isEditable ? 'collect-overlay' : ''}`}>
      <div className={`button-container ${isEditable ? 'editable' : 'non-editable'}`}>
        {isEditable ? (
          <>
            {/* Buttons */}
            <button
              onClick={handleToggleFastSelect}
              className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}
              disabled={!isEditable}
            >
              <img src="/images/fast_select.png" alt="Toggle Fast Select" />
            </button>
            <button
              className={`select-all-button ${selectAllEnabled ? 'active' : ''}`}
              onClick={handleSelectAll}
              disabled={!isEditable}
            >
              Select All
            </button>
            <button
              className={`pokedex-button ${ownershipFilter === '' ? 'pokedex-active' : ''}`}
              onClick={onClearOwnershipFilter}
              disabled={!isEditable}
            >
              <img src="/images/pokedex-icon-red.png" alt="Pokédex View" />
            </button>
            <button
              className={`lists-button ${listsButtonClass}`}
              onClick={onListsButtonClick}
              disabled={!isEditable}
            >
              {listsButtonText}
            </button>
          </>
        ) : (
          // Render context-text and lists button side by side when not editable
          <div className="non-editable-collect">
            <p className="context-text">{contextText}</p>
            <button
              className={`lists-button ${listsButtonClass}`}
              onClick={onListsButtonClick}
            >
              {listsButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectUI;
