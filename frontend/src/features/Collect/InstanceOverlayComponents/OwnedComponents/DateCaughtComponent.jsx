// DateCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import { parse, format, isValid } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import 'react-datepicker/dist/react-datepicker.css';
import './DateCaughtComponent.css';

registerLocale('en-US', enUS);

const DateCaughtComponent = ({ pokemon, editMode, onDateChange }) => {
  // Function to parse date from both "yyyy-MM-dd" and ISO 8601 formats
  const parseInitialDate = () => {
    const dateString = pokemon.ownershipStatus.date_caught;
    if (dateString) {
      // First try parsing "yyyy-MM-dd"
      let parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }

      // If that fails, try parsing ISO 8601
      parsedDate = new Date(dateString);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return null; // No valid date found, return null
  };

  const [date, setDate] = useState(parseInitialDate());
  const dateRef = useRef(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    setDate(parseInitialDate());
  }, [pokemon]);

  useEffect(() => {
    if (editMode && dateRef.current && date) {
      dateRef.current.textContent = format(date, 'yyyy-MM-dd');
      setCaretToEnd(dateRef.current);
      dateRef.current.focus(); // Automatically focus when entering edit mode
    }
  }, [editMode, date]);

  const handleDateInput = (event) => {
    const userInput = event.target.textContent.trim();
    if (userInput) {
      try {
        // First try parsing "yyyy-MM-dd"
        let parsedDate = parse(userInput, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
          // If that fails, try parsing ISO 8601
          parsedDate = new Date(userInput);
        }
        if (isValid(parsedDate)) {
          setDate(parsedDate);
          onDateChange(format(parsedDate, 'yyyy-MM-dd'));
          setShowCalendar(false);
        } else {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error(error); // Log the error for debugging
        setShowCalendar(true);
      }
    } else {
      // If input is cleared, reset the date
      setDate(null);
      onDateChange('');
    }
    setCaretToEnd(event.target);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setShowCalendar(false);
      dateRef.current.blur(); // Remove focus to stop editing
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
    onDateChange(format(selectedDate, 'yyyy-MM-dd'));
    setShowCalendar(false);
    dateRef.current.blur(); // Remove focus after selecting a date
  };

  const handleFocus = () => {
    setShowCalendar(true); // Show calendar on focus
  };

  // Conditional Rendering Logic
  if ((!date || !isValid(date)) && !editMode) {
    return null; // Do not render the component if date is null/invalid and not in edit mode
  }

  return (
    <div className="date-container">
      <div className="date-field">
        <label id="date-label">Date Caught:</label>
        <span
          aria-labelledby="date-label"
          contentEditable={editMode}
          ref={dateRef}
          onInput={handleDateInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          role="textbox"
          suppressContentEditableWarning={true}
          className={editMode ? 'editable' : 'text'}
        >
          {date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''}
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
