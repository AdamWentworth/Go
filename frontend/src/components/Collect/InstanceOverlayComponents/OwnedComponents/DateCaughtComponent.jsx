// DateCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import { parse, format, isValid } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US'; // Adjust locale as needed
import 'react-datepicker/dist/react-datepicker.css';
import './DateCaughtComponent.css';

registerLocale('en-US', enUS);

const DateCaughtComponent = ({ pokemon, editMode }) => {
  const parseInitialDate = () => {
    const dateString = pokemon.ownershipStatus.date_caught;
    if (dateString) {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return null; // No default date
  };

  const [date, setDate] = useState(parseInitialDate());
  const dateRef = useRef(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (editMode && dateRef.current && date) {
      dateRef.current.textContent = format(date, 'yyyy-MM-dd');
    }
  }, [editMode, date]);

  const handleDateInput = (event) => {
    const userInput = event.target.textContent.trim();
    if (userInput) {
      try {
        const parsedDate = parse(userInput, 'P', new Date()); // 'P' for flexible date parsing
        if (isValid(parsedDate)) {
          setDate(parsedDate);
          setShowCalendar(false);
        } else {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error(error); // Log the error for debugging
        setShowCalendar(true);
      }
    }
    setCaretToEnd(event.target);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setShowCalendar(false);
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

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    setShowCalendar(false);
  };

  const handleFocus = () => {
    setShowCalendar(true); // Show calendar on focus
  };

  return (
    <div className="date-container">
      <div className="date-field">
        <label htmlFor="date">Date Caught:</label>
        <span contentEditable={editMode}
              ref={dateRef}
              onInput={handleDateInput}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              suppressContentEditableWarning={true}
              className={editMode ? 'editable' : 'text'}>
          {date ? format(date, 'yyyy-MM-dd') : ''}
        </span>
        {showCalendar && (
          <DatePicker
            selected={date || new Date()} // If no date is set, default to today's date
            onChange={handleDateSelect}
            inline
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            locale="en-US"
          />
        )}
      </div>
    </div>
  );
};

export default DateCaughtComponent;