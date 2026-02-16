import React from 'react';

type DropdownOption = string | number;

type DropdownProps<T extends DropdownOption = string> = {
  label: string;
  value?: T | null;
  options: T[];
  handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  formatLabel?: (value: T) => React.ReactNode;
  className?: string;
};

const defaultFormatLabel = <T extends DropdownOption>(value: T): React.ReactNode =>
  value;

const Dropdown = <T extends DropdownOption>({
  label,
  value,
  options,
  handleChange,
  formatLabel = defaultFormatLabel<T>,
  className,
}: DropdownProps<T>) => {
  return (
    <div className={className}>
      <label>{label}: </label>
      <select value={value ?? ''} onChange={handleChange}>
        <option value="">None</option>
        {options.map((option) => (
          <option key={String(option)} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
