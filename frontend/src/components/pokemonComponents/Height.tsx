// Height.tsx
import React, { useEffect, useRef, useState } from 'react';
import './Height.css';

type Props = {
  pokemon: {
    instanceData: {
      height: number | null;
    };
    sizes?: {
      height_xxs_threshold: number;
      height_xs_threshold: number;
      height_xl_threshold: number;
      height_xxl_threshold: number;
    };
  };
  editMode: boolean;
  onHeightChange?: (height: string) => void;
};

const Height: React.FC<Props> = ({ pokemon, editMode, onHeightChange }) => {
  const [height, setHeight] = useState<string>(
    pokemon.instanceData.height ? String(pokemon.instanceData.height) : ''
  );
  const [userFocus, setUserFocus] = useState(false);
  const editableRef = useRef<HTMLSpanElement>(null);

  const setCaretToEnd = () => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current && sel) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editableRef.current.focus();
    }
  };

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = height || '';
      if (userFocus) {
        setCaretToEnd();
      }
    }
  }, [editMode, height, userFocus]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const newValue = event.currentTarget.innerText.replace('m', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) {
      setHeight(newValue);
      onHeightChange?.(newValue);
    } else {
      event.currentTarget.innerText = height;
    }
    if (userFocus) {
      setCaretToEnd();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current?.blur();
      setUserFocus(false);
    }
  };

  useEffect(() => {
    if (!editMode) {
      setHeight((prev) => (prev ? prev.trim() : ''));
      setUserFocus(false);
    }
  }, [editMode]);

  if (!editMode && !height) return null;

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
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
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