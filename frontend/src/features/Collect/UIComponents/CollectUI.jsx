// CollectUI.jsx

import React, { useEffect, useState } from 'react';
import './CollectUI.css';

const CollectUI = ({
  isEditable,
  onFastSelectToggle,
  onSelectAll,
  contextText,
  onListsButtonClick,
  ownershipFilter,
  onClearOwnershipFilter,
  isWide,
  username,
  isFastSelectEnabled,
  isSelectAllEnabled
}) => {
  // Add state to track touch interactions
  const [touchTarget, setTouchTarget] = useState(null);

  useEffect(() => {
    if (!isEditable) {
      if (isFastSelectEnabled) {
        onFastSelectToggle(false);
      }
      if (isSelectAllEnabled) {
        onSelectAll(false);
      }
    }
  }, [isEditable, isFastSelectEnabled, isSelectAllEnabled, onFastSelectToggle, onSelectAll]);

  // Handle touch start
  const handleTouchStart = (e, action) => {
    e.preventDefault();
    setTouchTarget(action);
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (touchTarget === 'fastSelect') {
      onFastSelectToggle(!isFastSelectEnabled);
    } else if (touchTarget === 'selectAll') {
      onSelectAll(!isSelectAllEnabled);
    }
    setTouchTarget(null);
  };

  // Determine Lists button styling
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

  const contextTextClass = username?.length > 10 ? 'context-text long-username' : 'context-text';

  return (
    <div className={`collect-ui ${!isWide && isEditable ? 'collect-overlay' : ''}`}>
      <div className={`button-container ${isEditable ? 'editable' : 'non-editable'}`}>
        {isEditable ? (
          <>
            <button
              onTouchStart={(e) => handleTouchStart(e, 'fastSelect')}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => {
                if (!('ontouchstart' in window)) {
                  onFastSelectToggle(!isFastSelectEnabled);
                }
              }}
              className={`fast-select-button ${isFastSelectEnabled ? 'active' : ''} ${touchTarget === 'fastSelect' ? 'touch-active' : ''}`}
              disabled={!isEditable}
            >
              <img src="/images/fast_select.png" alt="Toggle Fast Select" />
            </button>
            <button
              className={`select-all-button ${isSelectAllEnabled ? 'active' : ''} ${touchTarget === 'selectAll' ? 'touch-active' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, 'selectAll')}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => {
                if (!('ontouchstart' in window)) {
                  onSelectAll(!isSelectAllEnabled);
                }
              }}
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
          <div className="non-editable-collect">
            <p className={contextTextClass}>{contextText}</p>
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