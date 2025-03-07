// DateCaughtComponent.jsx

import React, { useRef, useState, useEffect } from 'react';
import { parse, format, isValid } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import enUS from 'date-fns/locale/en-US';
import 'react-datepicker/dist/react-datepicker.css';
import './DateCaught.css';

registerLocale('en-US', enUS);

const DateCaughtComponent = ({ pokemon, editMode, onDateChange }) => {
  const parseInitialDate = () => {
    const dateString = pokemon.ownershipStatus.date_caught;
    if (dateString) {
      let parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
      parsedDate = new Date(dateString);
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return null;
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
    }
  }, [editMode, date]);

  const handleDateInput = (event) => {
    const userInput = event.target.textContent.trim();
    if (userInput) {
      try {
        let parsedDate = parse(userInput, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
          parsedDate = new Date(userInput);
        }
        if (isValid(parsedDate)) {
          setDate(parsedDate);
          onDateChange(format(parsedDate, 'yyyy-MM-dd'));
        } else {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.error(error);
        setShowCalendar(true);
      }
    } else {
      setDate(null);
      onDateChange('');
    }
    setCaretToEnd(event.target);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setShowCalendar(false);
      dateRef.current.blur();
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
    if (dateRef.current) {
      dateRef.current.textContent = format(selectedDate, 'yyyy-MM-dd');
    }
    onDateChange(format(selectedDate, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };

  const handleClick = () => {
    if (editMode) {
      setShowCalendar(true);
    }
  };

  if ((!date || !isValid(date)) && !editMode) {
    return null;
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
          onClick={handleClick}
          role="textbox"
          suppressContentEditableWarning={true}
          className={editMode ? 'editable' : 'text'}
        >
          {date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''}
        </span>
        {showCalendar && editMode && (
          <DatePicker
            selected={date || new Date()}
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