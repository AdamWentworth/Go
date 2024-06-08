// DateCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import './DateCaughtComponent.css';

const DateCaughtComponent = ({ pokemon, editMode }) => {
  const [date, setDate] = useState(pokemon.ownershipStatus.date_caught);
  const dateRef = useRef(null);

  useEffect(() => {
    if (editMode && dateRef.current) {
      dateRef.current.textContent = date || '';
    }
  }, [editMode, date]);

  const handleDateInput = (event) => {
    const userInput = event.target.textContent;
    setDate(userInput);
    setCaretToEnd(event.target);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const setCaretToEnd = (target) => {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    target.focus();
  };

  return (
    <div className="date-container">
      <div className="date-field">
        <label htmlFor="date">Date Caught:</label>
        <span contentEditable={editMode}
              ref={dateRef}
              onInput={handleDateInput}
              onKeyDown={handleKeyDown}
              suppressContentEditableWarning={true}
              className={editMode ? 'editable' : 'text'}>
          {date}
        </span>
      </div>
    </div>
  );
};

export default DateCaughtComponent;