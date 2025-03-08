// Height.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Height.css';

const Height = ({ pokemon, editMode, onHeightChange }) => {
  const [height, setHeight] = useState(
    pokemon.ownershipStatus.height ? String(pokemon.ownershipStatus.height) : ''
  );
  const editableRef = useRef(null);

  // When entering edit mode, set the field's content without further re-rendering.
  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = height;
    }
  }, [editMode]); // Note: no dependency on height so that we don't update while typing.

  const handleInput = (event) => {
    // Read the current content without altering it.
    const newValue = event.target.innerText.replace('m', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) {
      // We update state here but do not force a DOM update.
      setHeight(newValue);
      onHeightChange(newValue);
    } else {
      // If invalid input, revert to the last valid value.
      event.target.innerText = height;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current.blur();
    }
  };

  // On blur, capture the final value.
  const handleBlur = () => {
    const currentText = editableRef.current.innerText.replace('m', '').trim();
    setHeight(currentText);
    onHeightChange(currentText);
  };

  if (!editMode && !height) {
    return null;
  }

  // Compute height category from numeric value.
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
              ref={editableRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="height-editable-content"
            />
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