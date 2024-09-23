// components/Dropdown.js

import React from 'react';

const Dropdown = ({ label, value, options, handleChange, formatLabel = (x) => x, className }) => {
  return (
    <div className={className}> {/* Use the className prop here */}
      <label>{label}: </label>
      <select value={value} onChange={handleChange}>
        <option value="">None</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;

