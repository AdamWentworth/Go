// DateCaught.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parse, format, isValid } from 'date-fns';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enUS } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateCaught.css';

registerLocale('en-US', enUS);

/* -------------------- typing helpers ----------------------------- */
type PokemonWithDate = {
  instanceData?: {
    date_caught?: string | null;
  };
};

export interface DateCaughtProps {
  pokemon: PokemonWithDate;
  editMode: boolean;
  onDateChange: (formatted: string) => void;
}

/* -------------------- component ---------------------------------- */
const DateCaughtComponent: React.FC<DateCaughtProps> = ({
  pokemon,
  editMode,
  onDateChange,
}) => {
  const parsedInitialDate = useMemo((): Date | null => {
    const raw = pokemon.instanceData?.date_caught; // string | null
    if (!raw) return null;

    let d = parse(raw, 'yyyy-MM-dd', new Date());
    if (!isValid(d)) d = new Date(raw);
    return isValid(d) ? d : null;
  }, [pokemon.instanceData?.date_caught]);

  const [date, setDate] = useState<Date | null>(parsedInitialDate);
  const [showCal, setShowCal] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  /* keep state in sync when new Pokémon object arrives */
  useEffect(() => setDate(parsedInitialDate), [parsedInitialDate]);

  /* write formatted date into the span in edit mode    */
  useEffect(() => {
    if (editMode && spanRef.current && date) {
      spanRef.current.textContent = format(date, 'yyyy-MM-dd');
    }
  }, [editMode, date]);

  /* -------------------- handlers -------------------- */
  const handleSpanInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const txt = e.currentTarget.textContent?.trim() ?? '';
    let d = parse(txt, 'yyyy-MM-dd', new Date());
    if (!isValid(d)) d = new Date(txt);

    if (isValid(d)) {
      setDate(d);
      onDateChange(format(d, 'yyyy-MM-dd'));
    } else {
      setShowCal(true);
    }
  };

  const handleCalSelect = (d: Date) => {
    setDate(d);
    spanRef.current!.textContent = format(d, 'yyyy-MM-dd');
    onDateChange(format(d, 'yyyy-MM-dd'));
    setShowCal(false);
  };

  /* -------------------- early return in view-mode --------------- */
  if (!editMode && (!date || !isValid(date))) return null;

  /* -------------------- render ---------------------------------- */
  return (
    <div className="date-container">
      <div className="date-field">
        <label id="date-label">Date&nbsp;Caught:</label>

        <span
          aria-labelledby="date-label"
          contentEditable={editMode}
          ref={spanRef}
          onInput={handleSpanInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setShowCal(false);
              spanRef.current?.blur();
            }
          }}
          onClick={() => editMode && setShowCal(true)}
          role="textbox"
          suppressContentEditableWarning
          className={editMode ? 'editable' : 'text'}
        >
          {date && isValid(date) ? format(date, 'yyyy-MM-dd') : ''}
        </span>

        {editMode && showCal && (
          <DatePicker
            inline
            selected={date ?? new Date()}
            onChange={handleCalSelect}
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
