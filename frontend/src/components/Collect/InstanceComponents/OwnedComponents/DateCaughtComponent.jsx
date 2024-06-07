// DateCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import './DateCaughtComponent.css';

const DateCaughtComponent = ({ pokemon }) => {
  const editIcon = process.env.PUBLIC_URL + '/images/edit-icon.png';
  const saveIcon = process.env.PUBLIC_URL + '/images/save-icon.png';
  const [date, setDate] = useState(pokemon.ownershipStatus.date_caught);
  const [editMode, setEditMode] = useState(false);
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
      saveChanges();
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

  const saveChanges = () => {
    setEditMode(false);
    if (dateRef.current) {
      dateRef.current.blur();
    }
    // Additional logic to save the date can be added here
  };

  const toggleEdit = () => {
    setEditMode(!editMode);
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
      <button onClick={toggleEdit} className="icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );
};

export default DateCaughtComponent;