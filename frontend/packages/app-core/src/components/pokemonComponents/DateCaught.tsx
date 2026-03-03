import React, { useEffect, useMemo, useState } from 'react';
import './DateCaught.css';

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

const normalizeDateValue = (raw: unknown): string => {
  if (!raw) return '';
  const asString = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;

  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const DateCaughtComponent: React.FC<DateCaughtProps> = ({
  pokemon,
  editMode,
  onDateChange,
}) => {
  const normalizedInitialDate = useMemo(
    () => normalizeDateValue(pokemon.instanceData?.date_caught),
    [pokemon.instanceData?.date_caught],
  );

  const [dateValue, setDateValue] = useState<string>(normalizedInitialDate);

  useEffect(() => {
    setDateValue(normalizedInitialDate);
  }, [normalizedInitialDate]);

  if (!editMode && !dateValue) return null;

  return (
    <div className="date-container">
      <div className="date-field">
        <label htmlFor="date-caught-input">Date&nbsp;Caught:</label>

        {editMode ? (
          <input
            id="date-caught-input"
            type="date"
            value={dateValue}
            onChange={(e) => {
              const next = e.target.value;
              setDateValue(next);
              onDateChange(next);
            }}
            className="editable"
          />
        ) : (
          <span className="text">{dateValue}</span>
        )}
      </div>
    </div>
  );
};

export default DateCaughtComponent;
