// Height.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Height.css';

const Height = ({ pokemon, editMode, onHeightChange }) => {
  const [height, setHeight] = useState(
    pokemon.ownershipStatus.height ? String(pokemon.ownershipStatus.height) : ''
  );
  const [userFocus, setUserFocus] = useState(false);
  const editableRef = useRef(null);

  function setCaretToEnd() {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editableRef.current.focus();
    }
  }

  // Sync the contentEditable text whenever editMode changes or height changes.
  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = height || '';
      if (userFocus) {
        setCaretToEnd();
      }
    }
  }, [editMode, height, userFocus]);

  const handleInput = (event) => {
    // Strip out "m" from user text
    const newValue = event.target.innerText.replace('m', '').trim();
    // Only allow numbers and an optional decimal point
    if (/^\d*\.?\d*$/.test(newValue)) {
      setHeight(newValue);
      if (onHeightChange) {
        onHeightChange(newValue);
      }
    } else {
      // If invalid, revert to the old value
      event.target.innerText = height;
    }
    if (userFocus) {
      setCaretToEnd();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Prevent newline
      event.preventDefault();
      editableRef.current.blur();
      setUserFocus(false);
    }
  };

  // If we exit edit mode, finalize the current value and reset focus.
  useEffect(() => {
    if (!editMode) {
      setHeight((prevHeight) => (prevHeight ? prevHeight.trim() : ''));
      setUserFocus(false);
    }
  }, [editMode]);

  // If there's no height in non-edit mode, don't render anything.
  if (!editMode && !height) {
    return null;
  }

  // Compute a "size tag" (e.g., XXS, XS, XL, XXL) if thresholds are provided
  const heightVal = parseFloat(height);
  let heightCategory = '';
  if (!isNaN(heightVal) && pokemon.sizes) {
    if (heightVal < pokemon.sizes.height_xxs_threshold) {
      heightCategory = 'XXS';
    } else if (heightVal < pokemon.sizes.height_xs_threshold) {
      heightCategory = 'XS';
    } else if (heightVal > pokemon.sizes.height_xxl_threshold) {
      heightCategory = 'XXL';
    } else if (heightVal > pokemon.sizes.height_xl_threshold) {
      heightCategory = 'XL';
    }
  }

  return (
    <div className="height-container">
      <div className="height-display">
        <div className={`height-editable-container ${editMode ? 'editable' : ''}`}>
          {editMode ? (
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              // Track userFocus so we can put the caret at the end
              onClick={() => setUserFocus(true)}
              onTouchStart={() => setUserFocus(true)}
              ref={editableRef}
              className="height-editable-content"
            >
              {height}
            </span>
          ) : (
            <span className="height-editable-content">{height}</span>
          )}
          <span className="height-suffix">m</span>
          {heightCategory && (
            <span className="height-category-tag">{heightCategory}</span>
          )}
        </div>
        <div className="height-label">Height</div>
      </div>
    </div>
  );
};

export default Height;
